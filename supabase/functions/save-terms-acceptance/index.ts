import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { user_id, subscription_id, browser_data } = await req.json();
    
    if (!user_id) {
      throw new Error('user_id is required');
    }

    // Get real IP address from headers
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = forwarded ? forwarded.split(',')[0].trim() : 
                   req.headers.get('x-real-ip') || 
                   'unknown';

    // Save terms acceptance with all collected data
    const { data, error } = await supabaseClient
      .from('terms_acceptances')
      .insert({
        user_id,
        subscription_id: subscription_id || null,
        accepted_at: new Date().toISOString(),
        ip_address: realIp,
        user_agent: browser_data.user_agent,
        locale: browser_data.locale,
        timezone: browser_data.timezone,
        screen_resolution: browser_data.screen_resolution,
        referrer: browser_data.referrer,
        extra: browser_data.extra,
        terms_version: '1.0'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving terms acceptance:', error);
      throw error;
    }

    console.log('Terms acceptance saved successfully:', data.id);

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in save-terms-acceptance function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
