import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, cache-control, pragma, x-supabase-authorization",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    const reqHeaders = req.headers.get("Access-Control-Request-Headers");
    const allowHeaders = reqHeaders || "authorization, x-client-info, apikey, content-type, cache-control, pragma, x-supabase-authorization";
    return new Response(null, { status: 204, headers: { ...corsHeaders, "Access-Control-Allow-Headers": allowHeaders } });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const requestBody = await req.json();
    const { email, password, name, cpf, phone, motvUserId, planId, plan_id: plan_id_body } = requestBody;
    const motv_user_id = motvUserId ?? requestBody.motv_user_id; // Accept both motvUserId and motv_user_id
    const plan_id = planId ?? plan_id_body; // Accept both planId and plan_id

    console.log("Creating user with email:", email);
    console.log("Request body:", { email, name, cpf: cpf ? "***" : null, phone, motv_user_id, plan_id });

    // Create user with email already confirmed
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

    if (authError) {
      console.error("Error creating auth user:", authError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: authError.message || "Erro ao criar usuário" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Auth user created:", authData.user.id);

    // Create or update profile
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: authData.user.id,
        email,
        name,
        cpf: cpf || null,
        phone: phone || null,
        motv_user_id: motv_user_id || null,
        role: "user",
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.error("Error creating profile:", profileError);
      // Rollback: delete the auth user
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
        console.log("Rollback successful: deleted auth user", authData.user.id);
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError);
      }
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: profileError.message || "Falha ao criar perfil do usuário" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Profile created successfully");

    // Create subscription if plan_id is provided
    if (plan_id) {
      console.log("Creating subscription for plan:", plan_id);
      const { error: subscriptionError } = await supabase
        .from("subscriptions")
        .insert({
          user_id: authData.user.id,
          plan_id: plan_id,
          status: "active",
          start_date: new Date().toISOString()
        });

      if (subscriptionError) {
        console.error("Error creating subscription:", subscriptionError);
        // Don't rollback - user is created, they can be assigned a plan later
      } else {
        console.log("Subscription created successfully");
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: authData.user.id,
        email: authData.user.email
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Erro desconhecido ao processar cadastro" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
