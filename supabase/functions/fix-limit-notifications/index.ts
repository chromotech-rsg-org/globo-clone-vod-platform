import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Atualizar todas as notificações de limite para auction_id NULL
    // já que limites são globais, não específicos de leilão
    const { data, error } = await supabaseClient
      .from('limit_request_responses')
      .update({ auction_id: null })
      .not('auction_id', 'is', null)
      .select('id, user_id, auction_id');

    if (error) {
      console.error('Error updating limit notifications:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        updated_count: data?.length || 0,
        message: 'Notificações de limite atualizadas com sucesso. Elas agora aparecerão em todos os leilões.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in fix-limit-notifications function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
