import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Autenticar usuário
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { paymentId } = await req.json();

    // Buscar pagamento no banco
    const { data: payment } = await supabase
      .from('asaas_payments')
      .select('*')
      .eq('id', paymentId)
      .eq('user_id', user.id)
      .single();

    if (!payment) {
      throw new Error('Pagamento não encontrado');
    }

    // Buscar configurações do Asaas
    const { data: settings } = await supabase
      .from('asaas_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    if (!settings) {
      throw new Error('Asaas não configurado');
    }

    const apiKey = settings.environment === 'production' 
      ? settings.production_api_key 
      : settings.sandbox_api_key;

    const baseUrl = settings.environment === 'production'
      ? 'https://api.asaas.com/v3'
      : 'https://sandbox.asaas.com/api/v3';

    // Consultar status na API do Asaas
    const asaasResponse = await fetch(`${baseUrl}/payments/${payment.asaas_payment_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
    });

    const asaasData = await asaasResponse.json();

    if (!asaasResponse.ok) {
      console.error('Asaas error:', asaasData);
      throw new Error(asaasData.errors?.[0]?.description || 'Erro ao consultar pagamento');
    }

    // Atualizar pagamento no banco se houver mudança de status
    if (asaasData.status !== payment.status) {
      await supabase
        .from('asaas_payments')
        .update({
          status: asaasData.status,
          raw_data: asaasData,
        })
        .eq('id', payment.id);
    }

    return new Response(JSON.stringify({
      status: asaasData.status,
      payment: {
        ...payment,
        status: asaasData.status,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in asaas-check-payment-status:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});