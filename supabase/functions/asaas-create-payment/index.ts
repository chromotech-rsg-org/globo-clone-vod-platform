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

    const { customerId, planId, paymentMethod, creditCardData } = await req.json();

    // Buscar configurações do Asaas
    const { data: settings } = await supabase
      .from('asaas_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    if (!settings) {
      throw new Error('Asaas não configurado');
    }

    // Buscar plano
    const { data: plan } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (!plan) {
      throw new Error('Plano não encontrado');
    }

    const apiKey = settings.environment === 'production' 
      ? settings.production_api_key 
      : settings.sandbox_api_key;

    const baseUrl = settings.environment === 'production'
      ? 'https://api.asaas.com/v3'
      : 'https://sandbox.asaas.com/api/v3';

    // Calcular data de vencimento (7 dias para boleto, hoje para PIX e cartão)
    const dueDate = new Date();
    if (paymentMethod === 'BOLETO') {
      dueDate.setDate(dueDate.getDate() + 7);
    }

    // Criar cobrança no Asaas
    const paymentPayload: any = {
      customer: customerId,
      billingType: paymentMethod,
      value: plan.price,
      dueDate: dueDate.toISOString().split('T')[0],
      description: `Assinatura ${plan.name}`,
      externalReference: planId,
    };

    // Se for cartão de crédito, adicionar dados do cartão
    if (paymentMethod === 'CREDIT_CARD' && creditCardData) {
      paymentPayload.creditCard = {
        holderName: creditCardData.holderName,
        number: creditCardData.number.replace(/\s/g, ''),
        expiryMonth: creditCardData.expiryMonth,
        expiryYear: creditCardData.expiryYear,
        ccv: creditCardData.ccv,
      };
      paymentPayload.creditCardHolderInfo = {
        name: creditCardData.holderName,
        email: user.email,
        cpfCnpj: creditCardData.cpf?.replace(/\D/g, ''),
        postalCode: creditCardData.postalCode?.replace(/\D/g, ''),
        addressNumber: creditCardData.addressNumber,
        phone: creditCardData.phone?.replace(/\D/g, ''),
      };
    }

    console.log('Creating payment with payload:', JSON.stringify(paymentPayload, null, 2));

    const asaasResponse = await fetch(`${baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
      body: JSON.stringify(paymentPayload),
    });

    const asaasData = await asaasResponse.json();

    if (!asaasResponse.ok) {
      console.error('Asaas payment error:', asaasData);
      throw new Error(asaasData.errors?.[0]?.description || 'Erro ao criar pagamento');
    }

    console.log('Asaas payment created:', asaasData);

    // Salvar pagamento no banco
    const { data: payment } = await supabase.from('asaas_payments').insert({
      user_id: user.id,
      plan_id: planId,
      asaas_payment_id: asaasData.id,
      asaas_customer_id: customerId,
      payment_method: paymentMethod,
      value: plan.price,
      status: asaasData.status,
      due_date: asaasData.dueDate,
      invoice_url: asaasData.invoiceUrl,
      bank_slip_url: asaasData.bankSlipUrl,
      pix_qr_code: asaasData.encodedImage,
      pix_copy_paste: asaasData.payload,
      raw_data: asaasData,
      environment: settings.environment,
    }).select().single();

    // Preparar resposta baseada no método de pagamento
    const response: any = {
      paymentId: asaasData.id,
      status: asaasData.status,
      value: asaasData.value,
      dueDate: asaasData.dueDate,
      invoiceUrl: asaasData.invoiceUrl,
      internalPaymentId: payment.id,
    };

    if (paymentMethod === 'BOLETO') {
      response.bankSlipUrl = asaasData.bankSlipUrl;
      response.identificationField = asaasData.identificationField;
    } else if (paymentMethod === 'PIX') {
      response.pixQrCode = asaasData.encodedImage;
      response.pixCopyPaste = asaasData.payload;
      response.expirationDate = asaasData.expirationDate;
    } else if (paymentMethod === 'CREDIT_CARD') {
      response.creditCardStatus = asaasData.status;
      response.transactionReceiptUrl = asaasData.transactionReceiptUrl;
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in asaas-create-payment:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});