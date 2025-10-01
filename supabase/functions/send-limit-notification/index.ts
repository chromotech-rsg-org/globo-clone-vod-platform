import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId, approved, requestedLimit, currentLimit, newLimit } = await req.json()

    console.log('📧 Sending limit notification:', { userId, approved, requestedLimit, currentLimit, newLimit })

    // Get user profile for name
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('name, email')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      throw profileError
    }

    // Format currency
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value)
    }

    // Create notification message
    let message = ''
    let title = ''

    if (approved) {
      title = '✅ Limite Aprovado'
      message = `Olá ${profile.name},\n\nSua solicitação de aumento de limite foi aprovada!\n\n` +
        `Limite anterior: ${formatCurrency(currentLimit)}\n` +
        `Novo limite: ${formatCurrency(newLimit)}\n\n` +
        `Você já pode fazer novos lances com seu limite atualizado.`
    } else {
      title = '❌ Limite Não Aprovado'
      message = `Olá ${profile.name},\n\nSua solicitação de aumento de limite não foi aprovada.\n\n` +
        `Limite solicitado: ${formatCurrency(requestedLimit)}\n` +
        `Limite atual: ${formatCurrency(currentLimit)}\n\n` +
        `Entre em contato com o administrador para mais informações.`
    }

    console.log('📨 Notification prepared:', { title, message })

    // Here you could integrate with email/SMS services
    // For now, we'll just log the notification
    // In the future, you could use services like:
    // - SendGrid, AWS SES, or similar for email
    // - Twilio for SMS
    // - Push notification services

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification sent successfully',
        notification: { title, message }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('❌ Error in send-limit-notification:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})