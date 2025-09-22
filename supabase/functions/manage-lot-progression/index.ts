import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, x-requested-with, accept, origin, referer',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface SetWinnerRequest {
  bidId: string;
  autoStartNext?: boolean;
}

interface StartNextLotRequest {
  auctionId: string;
  lotId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    const requestHeaders = req.headers.get('access-control-request-headers');
    const headers = {
      ...corsHeaders,
      'Access-Control-Allow-Headers': requestHeaders || corsHeaders['Access-Control-Allow-Headers'],
    } as Record<string, string>;
    return new Response(null, { headers });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header found');
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user role before proceeding
    const { data: roleData, error: roleError } = await supabaseClient.rpc('get_current_user_role');
    if (roleError) {
      console.error('Error getting user role:', roleError);
      return new Response(JSON.stringify({ error: 'Failed to verify user permissions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('User role:', roleData);
    if (!['admin', 'desenvolvedor'].includes(roleData)) {
      console.error('User does not have admin privileges:', roleData);
      return new Response(JSON.stringify({ error: 'Admin privileges required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, ...payload } = await req.json();

  if (action === 'set_winner_and_finalize') {
    const { bidId, autoStartNext = false } = payload as SetWinnerRequest;

    console.log('Setting winner for bid:', bidId);

    if (!bidId) {
      console.error('No bid ID provided');
      return new Response(JSON.stringify({ error: 'ID do lance é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call the database function to set winner and finalize lot
    const { data: result, error } = await supabaseClient.rpc(
      'set_bid_winner_and_finalize_lot',
      { p_bid_id: bidId }
    );

    if (error) {
      console.error('Database function error:', error);
      return new Response(JSON.stringify({ 
        error: `Erro ao definir vencedor: ${error.message}` 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!result) {
      console.error('No result returned from database function');
      return new Response(JSON.stringify({ 
        error: 'Erro interno: função não retornou resultado' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Winner set successfully, result:', result);

    let nextLotStarted = false;
    
    // If auto start is enabled and there's a next lot available
    if (autoStartNext && result.next_lot_available && result.next_lot_id) {
      console.log('Auto-starting next lot:', result.next_lot_id);
      
      const { data: startResult, error: startError } = await supabaseClient.rpc(
        'start_next_lot',
        { 
          p_auction_id: result.auction_id || payload.auctionId,
          p_lot_id: result.next_lot_id 
        }
      );

      if (startError) {
        console.error('Error starting next lot:', startError);
      } else {
        nextLotStarted = startResult;
        console.log('Next lot started successfully');
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      ...result,
      next_lot_started: nextLotStarted 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
      
    } else if (action === 'start_next_lot') {
      const { auctionId, lotId } = payload as StartNextLotRequest;

      console.log('Starting next lot:', lotId, 'for auction:', auctionId);

      const { data: result, error } = await supabaseClient.rpc(
        'start_next_lot',
        { 
          p_auction_id: auctionId,
          p_lot_id: lotId 
        }
      );

      if (error) {
        console.error('Error starting next lot:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Lot started successfully:', result);

      return new Response(JSON.stringify({ 
        success: result,
        lot_started: result 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in manage-lot-progression function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});