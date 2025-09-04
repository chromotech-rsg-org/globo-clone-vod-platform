import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TEST-API-CONNECTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Initialize Supabase client with service role key
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

    logStep("User authenticated and authorized", { userId: user.id, role: profile.role });

    // Get integration settings
    const { data: settings, error: settingsError } = await supabaseClient
      .from('integration_settings')
      .select('api_base_url, api_login, api_secret')
      .eq('active', true)
      .single();

    if (settingsError || !settings) {
      throw new Error("Integration settings not found. Please configure the API settings first.");
    }

    logStep("Integration settings retrieved", { 
      baseUrl: settings.api_base_url,
      hasLogin: !!settings.api_login,
      hasSecret: !!settings.api_secret
    });

    // Validate settings
    if (!settings.api_base_url || !settings.api_login || !settings.api_secret) {
      throw new Error("Incomplete API settings. Please fill in all required fields.");
    }

    // Test API connection
    logStep("Testing API connection");

    // Create basic auth header
    const credentials = btoa(`${settings.api_login}:${settings.api_secret}`);
    const authValue = `Basic ${credentials}`;

    // Make a test request to the API
    const testUrl = `${settings.api_base_url.replace(/\/$/, '')}/health`; // Try health endpoint first
    
    let response;
    let testEndpoint = "health";
    
    try {
      response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': authValue,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      logStep("Health endpoint test", { status: response.status, url: testUrl });
    } catch (healthError) {
      logStep("Health endpoint failed, trying root endpoint", { error: healthError.message });
      
      // If health endpoint fails, try root endpoint
      const rootUrl = settings.api_base_url.replace(/\/$/, '');
      testEndpoint = "root";
      
      try {
        response = await fetch(rootUrl, {
          method: 'GET',
          headers: {
            'Authorization': authValue,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(10000)
        });
        logStep("Root endpoint test", { status: response.status, url: rootUrl });
      } catch (rootError) {
        logStep("Both endpoints failed", { healthError: healthError.message, rootError: rootError.message });
        throw new Error(`API connection failed: Unable to reach ${settings.api_base_url}. Error: ${rootError.message}`);
      }
    }

    // Check response status
    const isSuccess = response.status >= 200 && response.status < 300;
    const statusText = response.statusText || 'Unknown';
    
    let responseBody = '';
    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const jsonResponse = await response.json();
        responseBody = JSON.stringify(jsonResponse, null, 2);
      } else {
        responseBody = await response.text();
        if (responseBody.length > 500) {
          responseBody = responseBody.substring(0, 500) + '...';
        }
      }
    } catch (bodyError) {
      responseBody = `Unable to read response body: ${bodyError.message}`;
    }

    logStep("API test completed", { 
      success: isSuccess, 
      status: response.status, 
      statusText,
      endpoint: testEndpoint,
      responseLength: responseBody.length
    });

    return new Response(JSON.stringify({
      success: isSuccess,
      status: response.status,
      statusText,
      endpoint: testEndpoint,
      message: isSuccess 
        ? `API connection successful! Server responded with status ${response.status} (${statusText})` 
        : `API responded with status ${response.status} (${statusText}). This might indicate authentication issues or server problems.`,
      responseBody: responseBody.substring(0, 1000), // Limit response body size
      testedUrl: testEndpoint === "health" ? testUrl : settings.api_base_url
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in test-api-connection", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage,
      message: `Connection test failed: ${errorMessage}`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, // Return 200 but with success: false for proper error handling
    });
  }
});