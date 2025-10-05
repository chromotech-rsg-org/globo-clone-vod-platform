import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, newPlanId, action } = await req.json();

    console.log('[manage-subscription-motv] Action:', action, 'User:', userId, 'New Plan:', newPlanId);

    // 1. Buscar motv_user_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('motv_user_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.motv_user_id) {
      console.warn('[manage-subscription-motv] User has no motv_user_id');
      return new Response(
        JSON.stringify({ success: true, message: 'User has no MOTV ID, skipping MOTV update' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const motvUserId = profile.motv_user_id;

    if (action === 'cancel') {
      // Cancelar plano
      console.log('[manage-subscription-motv] Canceling plan for MOTV user:', motvUserId);

      // Buscar pacote de suspensão
      const { data: suspensionPkg } = await supabase
        .from('packages')
        .select('code')
        .eq('suspension_package', true)
        .eq('active', true)
        .maybeSingle();

      // Cancelar todos os planos
      const { data: cancelData, error: cancelError } = await supabase.functions.invoke('motv-proxy', {
        body: {
          op: 'cancelAll',
          viewers_id: motvUserId
        }
      });

      if (cancelError) throw cancelError;

      const cancelResult = cancelData?.result;
      const cancelStatus = typeof cancelResult?.status === 'number' ? cancelResult.status : parseInt(cancelResult?.status);
      if (cancelStatus !== 1) {
        throw new Error(cancelResult?.message || 'Erro ao cancelar planos na MOTV');
      }

      // Se existe pacote de suspensão, aplicar
      if (suspensionPkg?.code) {
        console.log('[manage-subscription-motv] Applying suspension package:', suspensionPkg.code);
        
        const { data: subData, error: subError } = await supabase.functions.invoke('motv-proxy', {
          body: {
            op: 'subscribe',
            payload: {
              viewers_id: motvUserId,
              products_id: suspensionPkg.code
            }
          }
        });

        if (subError) throw subError;

        const subResult = subData?.result;
        const subStatus = typeof subResult?.status === 'number' ? subResult.status : parseInt(subResult?.status);
        if (subStatus !== 1) {
          throw new Error(subResult?.message || 'Erro ao aplicar suspensão na MOTV');
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Plan canceled successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'change' && newPlanId) {
      // Trocar plano
      console.log('[manage-subscription-motv] Changing plan to:', newPlanId);

      // Buscar package code do novo plano
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('package_id, packages(code)')
        .eq('id', newPlanId)
        .single();

      if (planError || !(plan?.packages as any)?.code) {
        throw new Error('Plano não possui pacote associado');
      }

      const packageCode = (plan.packages as any).code;

      // Cancelar planos atuais
      const { data: cancelData, error: cancelError } = await supabase.functions.invoke('motv-proxy', {
        body: {
          op: 'cancelAll',
          viewers_id: motvUserId
        }
      });

      if (cancelError) throw cancelError;

      const cancelResult = cancelData?.result;
      const cancelStatus = typeof cancelResult?.status === 'number' ? cancelResult.status : parseInt(cancelResult?.status);
      if (cancelStatus !== 1) {
        throw new Error(cancelResult?.message || 'Erro ao cancelar planos na MOTV');
      }

      // Aplicar novo plano
      const { data: subData, error: subError } = await supabase.functions.invoke('motv-proxy', {
        body: {
          op: 'subscribe',
          payload: {
            viewers_id: motvUserId,
            products_id: packageCode
          }
        }
      });

      if (subError) throw subError;

      const subResult = subData?.result;
      const subStatus = typeof subResult?.status === 'number' ? subResult.status : parseInt(subResult?.status);
      if (subStatus !== 1) {
        throw new Error(subResult?.message || 'Erro ao aplicar novo plano na MOTV');
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Plan changed successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');
  } catch (error) {
    console.error('[manage-subscription-motv] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
