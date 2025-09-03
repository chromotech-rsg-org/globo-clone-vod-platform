import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IntegrationSettings {
  api_base_url: string;
  api_login: string;
  api_secret: string;
}

interface IntegrationJob {
  id: string;
  job_type: string;
  entity_type: string;
  entity_id: string;
  payload: any;
  attempts: number;
  max_attempts: number;
}

// Generate authentication token
function generateAuthToken(login: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const data = `${timestamp}${login}${secret}`;
  
  // Simple SHA1 implementation for Deno
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  return crypto.subtle.digest('SHA-1', dataBuffer).then(hashBuffer => {
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `${login}:${timestamp}:${hashHex}`;
  });
}

async function processJob(supabase: any, job: IntegrationJob, settings: IntegrationSettings) {
  console.log(`Processing job ${job.id} of type ${job.job_type}`);
  
  let endpoint = '';
  let method = 'POST';
  let payload = job.payload;

  // Determine endpoint based on job type
  switch (job.job_type) {
    case 'create_user':
      endpoint = '/api/integration/createMotvCustomer';
      break;
    case 'update_user':
      endpoint = '/api/integration/updateMotvCustomer';
      break;
    case 'delete_user':
      endpoint = '/api/integration/cancel';
      break;
    case 'subscribe':
      endpoint = '/api/integration/subscribe';
      break;
    case 'get_customer':
      endpoint = '/api/customer/getDataV2';
      method = 'GET';
      break;
    case 'find_customer':
      endpoint = '/api/customer/findCustomerForSales';
      method = 'GET';
      break;
    default:
      throw new Error(`Unknown job type: ${job.job_type}`);
  }

  const fullUrl = `${settings.api_base_url.replace(/\/$/, '')}${endpoint}`;
  
  try {
    // Generate auth token
    const authToken = await generateAuthToken(settings.api_login, settings.api_secret);
    
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken,
      },
    };

    if (method === 'POST') {
      requestOptions.body = JSON.stringify(payload);
    }

    console.log(`Making ${method} request to ${fullUrl}`);
    
    const response = await fetch(fullUrl, requestOptions);
    const responseData = await response.json();

    // Log the integration call
    await supabase.from('integration_logs').insert({
      job_id: job.id,
      endpoint: fullUrl,
      request_payload: method === 'POST' ? payload : null,
      response_payload: responseData,
      status_code: response.status,
      success: response.ok,
      error_message: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`,
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    // Mark job as completed
    await supabase.from('integration_jobs').update({
      status: 'completed',
      processed_at: new Date().toISOString(),
    }).eq('id', job.id);

    console.log(`Job ${job.id} completed successfully`);
    return { success: true, data: responseData };

  } catch (error) {
    console.error(`Job ${job.id} failed:`, error);
    
    const newAttempts = job.attempts + 1;
    const status = newAttempts >= job.max_attempts ? 'failed' : 'pending';
    
    // Update job with error info
    await supabase.from('integration_jobs').update({
      status,
      attempts: newAttempts,
      last_error: error.message,
      processed_at: status === 'failed' ? new Date().toISOString() : null,
    }).eq('id', job.id);

    // Log the error
    await supabase.from('integration_logs').insert({
      job_id: job.id,
      endpoint: fullUrl,
      request_payload: method === 'POST' ? payload : null,
      response_payload: null,
      status_code: 0,
      success: false,
      error_message: error.message,
    });

    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, jobId } = await req.json();

    if (action === 'process_pending') {
      // Get integration settings
      const { data: settings, error: settingsError } = await supabase
        .from('integration_settings')
        .select('*')
        .eq('active', true)
        .single();

      if (settingsError || !settings) {
        console.error('No active integration settings found:', settingsError);
        return new Response(
          JSON.stringify({ error: 'Integration not configured' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get pending jobs
      const { data: jobs, error: jobsError } = await supabase
        .from('integration_jobs')
        .select('*')
        .eq('status', 'pending')
        .lt('attempts', 3)
        .order('created_at', { ascending: true })
        .limit(10);

      if (jobsError) {
        console.error('Error fetching jobs:', jobsError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch jobs' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const results = [];
      for (const job of jobs || []) {
        try {
          const result = await processJob(supabase, job, settings);
          results.push({ jobId: job.id, success: true, result });
        } catch (error) {
          results.push({ jobId: job.id, success: false, error: error.message });
        }
      }

      return new Response(
        JSON.stringify({ processed: results.length, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'process_job' && jobId) {
      // Get integration settings
      const { data: settings, error: settingsError } = await supabase
        .from('integration_settings')
        .select('*')
        .eq('active', true)
        .single();

      if (settingsError || !settings) {
        return new Response(
          JSON.stringify({ error: 'Integration not configured' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get specific job
      const { data: job, error: jobError } = await supabase
        .from('integration_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError || !job) {
        return new Response(
          JSON.stringify({ error: 'Job not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        const result = await processJob(supabase, job, settings);
        return new Response(
          JSON.stringify({ success: true, result }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Integration dispatcher error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});