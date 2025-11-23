import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, pragma, expires, user-agent, accept, accept-language',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    // Check if user is admin or developer
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) throw new Error("User profile not found");
    
    if (!['admin', 'desenvolvedor'].includes(profile.role)) {
      throw new Error("Access denied: Admin or developer role required");
    }

    // Get request parameters
    const { method, endpoint, body: requestBody, apiKey, environment } = await req.json();

    if (!apiKey) {
      throw new Error("API key is required");
    }

    if (!endpoint) {
      throw new Error("Endpoint is required");
    }

    // Determine base URL based on environment
    const baseUrl = environment === 'sandbox' 
      ? 'https://sandbox.asaas.com/api/v3'
      : 'https://www.asaas.com/api/v3';

    const fullUrl = `${baseUrl}${endpoint}`;

    // Make the API request
    const response = await fetch(fullUrl, {
      method: method || 'GET',
      headers: {
        'Authorization': apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: requestBody ? JSON.stringify(requestBody) : undefined,
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    const responseData = await response.json();

    // Log the request for debugging
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: method || 'GET',
      endpoint,
      environment,
      status: response.status,
      success: response.ok,
      user_id: user.id
    };

    // Store log in database (optional)
    await supabaseClient
      .from('api_request_logs')
      .insert([logEntry])
      .catch(() => {
        // Ignore logging errors - don't fail the main request
        console.log('Failed to store request log');
      });

    return new Response(JSON.stringify({
      success: response.ok,
      status: response.status,
      data: responseData
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[ASAAS-API-PROXY] Error:', errorMessage);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});