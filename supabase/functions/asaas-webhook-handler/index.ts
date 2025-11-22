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

    const webhook = await req.json();
    console.log('Webhook received:', JSON.stringify(webhook, null, 2));

    // Salvar evento no banco
    const { data: webhookEvent } = await supabase
      .from('asaas_webhook_events')
      .insert({
        event_type: webhook.event,
        asaas_payment_id: webhook.payment?.id,
        payload: webhook,
        processed: false,
      })
      .select()
      .single();

    // Processar evento baseado no tipo
    try {
      if (webhook.event === 'PAYMENT_RECEIVED' || webhook.event === 'PAYMENT_CONFIRMED') {
        // Buscar pagamento no banco
        const { data: payment } = await supabase
          .from('asaas_payments')
          .select('*, profiles!inner(*)')
          .eq('asaas_payment_id', webhook.payment.id)
          .single();

        if (payment) {
          // Atualizar status do pagamento
          await supabase
            .from('asaas_payments')
            .update({
              status: webhook.payment.status,
              payment_date: new Date().toISOString(),
            })
            .eq('id', payment.id);

          // Criar ou atualizar assinatura do usuário
          const { data: existingSubscription } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', payment.user_id)
            .eq('status', 'active')
            .single();

          const startDate = new Date();
          const endDate = new Date(startDate);
          
          // Adicionar período baseado no billing_cycle do plano
          const { data: plan } = await supabase
            .from('plans')
            .select('billing_cycle')
            .eq('id', payment.plan_id)
            .single();

          if (plan?.billing_cycle === 'monthly') {
            endDate.setMonth(endDate.getMonth() + 1);
          } else if (plan?.billing_cycle === 'annual') {
            endDate.setFullYear(endDate.getFullYear() + 1);
          } else {
            endDate.setMonth(endDate.getMonth() + 1); // default monthly
          }

          if (existingSubscription) {
            // Atualizar assinatura existente
            await supabase
              .from('subscriptions')
              .update({
                plan_id: payment.plan_id,
                end_date: endDate.toISOString(),
                status: 'active',
              })
              .eq('id', existingSubscription.id);
          } else {
            // Criar nova assinatura
            await supabase
              .from('subscriptions')
              .insert({
                user_id: payment.user_id,
                plan_id: payment.plan_id,
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                status: 'active',
              });
          }

          // Atualizar plan_id do perfil do usuário
          await supabase
            .from('profiles')
            .update({ plan_id: payment.plan_id })
            .eq('id', payment.user_id);

          console.log('Subscription activated for user:', payment.user_id);
        }
      } else if (webhook.event === 'PAYMENT_OVERDUE') {
        // Atualizar status do pagamento
        await supabase
          .from('asaas_payments')
          .update({ status: 'OVERDUE' })
          .eq('asaas_payment_id', webhook.payment.id);
      }

      // Marcar webhook como processado
      await supabase
        .from('asaas_webhook_events')
        .update({
          processed: true,
          processed_at: new Date().toISOString(),
        })
        .eq('id', webhookEvent.id);

    } catch (processError) {
      console.error('Error processing webhook:', processError);
      
      // Marcar webhook com erro
      await supabase
        .from('asaas_webhook_events')
        .update({
          processed: false,
          error_message: processError.message,
        })
        .eq('id', webhookEvent.id);

      throw processError;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in asaas-webhook-handler:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});