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

    const { name, email, cpf, phone } = await req.json();

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

    // Verificar se cliente já existe
    const { data: existingCustomer } = await supabase
      .from('asaas_customers')
      .select('*')
      .eq('user_id', user.id)
      .eq('environment', settings.environment)
      .single();

    if (existingCustomer) {
      return new Response(JSON.stringify({
        asaasCustomerId: existingCustomer.asaas_customer_id,
        environment: settings.environment,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Criar cliente no Asaas
    const asaasResponse = await fetch(`${baseUrl}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
      body: JSON.stringify({
        name,
        email,
        cpfCnpj: cpf.replace(/\D/g, ''),
        mobilePhone: phone?.replace(/\D/g, ''),
      }),
    });

    const asaasData = await asaasResponse.json();

    if (!asaasResponse.ok) {
      console.error('Asaas error:', asaasData);
      throw new Error(asaasData.errors?.[0]?.description || 'Erro ao criar cliente');
    }

    // Salvar cliente no banco
    await supabase.from('asaas_customers').insert({
      user_id: user.id,
      asaas_customer_id: asaasData.id,
      environment: settings.environment,
      customer_data: asaasData,
    });

    return new Response(JSON.stringify({
      asaasCustomerId: asaasData.id,
      environment: settings.environment,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in asaas-create-customer:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});