import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, cache-control, pragma, x-supabase-authorization",
};

interface IntegrationSettings {
  api_base_url: string;
  api_login: string;
  api_secret: string;
  vendor_id?: number;
}

async function generateAuthToken(login: string, secret: string): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000);
  const str = `${timestamp}${login}${secret}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${login}:${timestamp}:${hashHex}`;
}

function mapOpToEndpoint(op: string): { path: string; method: "POST" | "GET" } {
  switch (op) {
    case "getCustomer":
      return { path: "/api/customer/getDataV2", method: "POST" };
    case "findCustomer":
      return { path: "/api/customer/getDataV2", method: "POST" };
    case "apiLogin":
      return { path: "/api/devices/motv/apiLoginV2", method: "POST" };
    case "getPlanInfo":
      return { path: "/api/subscription/getCustomerSubscriptionInfo", method: "POST" };
    case "createCustomer":
      return { path: "/api/integration/createMotvCustomer", method: "POST" };
    case "updateCustomer":
      return { path: "/api/integration/updateMotvCustomer", method: "POST" };
    case "cancelAll":
      return { path: "/api/integration/cancel", method: "POST" };
    case "subscribe":
      return { path: "/api/integration/subscribe", method: "POST" };
    case "check-config":
      return { path: "", method: "GET" };
    default:
      throw new Error(`Operação não suportada: ${op}`);
  }
}

serve(async (req) => {
if (req.method === "OPTIONS") {
  const reqHeaders = req.headers.get("Access-Control-Request-Headers");
  const allowHeaders = reqHeaders || "authorization, x-client-info, apikey, content-type, cache-control, pragma, x-supabase-authorization";
  return new Response(null, {
    status: 204,
    headers: { ...corsHeaders, "Access-Control-Allow-Headers": allowHeaders },
  });
}

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

const { op, payload } = await req.json();
const requestPayload: any = payload ?? {};

    // Buscar configurações ativas
    const { data: settings, error: settingsError } = await supabase
      .from("integration_settings")
      .select("api_base_url, api_login, api_secret, vendor_id")
      .eq("active", true)
      .single();

    if (settingsError || !settings) {
      return new Response(
        JSON.stringify({ ok: false, error: "Integration not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (op === "check-config") {
      return new Response(
        JSON.stringify({ ok: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

const { path, method } = mapOpToEndpoint(op);
const baseUrl = settings.api_base_url.replace(/\/$/, "");
const url = `${baseUrl}${path}`;

// Inject vendor id for apiLogin if not provided
if (op === "apiLogin" && requestPayload && requestPayload.vendors_id == null && (settings as any).vendor_id) {
  requestPayload.vendors_id = (settings as any).vendor_id;
}

const token = await generateAuthToken(settings.api_login, settings.api_secret);
const headers: Record<string, string> = {
  "Content-Type": "application/json",
  "Accept": "application/json",
  "Authorization": token,
};

const body = method === "POST" ? JSON.stringify({ data: requestPayload }) : undefined;

console.log("[motv-proxy] calling MOTV", { op, method, url });
const response = await fetch(url, { method, headers, body });
let result: any = null;
try {
  result = await response.json();
  console.log("[motv-proxy] MOTV response", { 
    httpStatus: response.status, 
    apiStatus: result?.status, 
    apiCode: result?.code 
  });
} catch (_) {
  result = await response.text();
  console.log("[motv-proxy] MOTV response (text)", { httpStatus: response.status });
}

    return new Response(
      JSON.stringify({ ok: response.ok, status: response.status, result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});