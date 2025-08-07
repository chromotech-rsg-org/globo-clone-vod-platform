import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Bid {
  id: string;
  user_id: string;
  auction_id: string;
  auction_item_id: string;
  bid_value: number;
  status: 'approved' | 'pending' | 'rejected' | 'superseded';
  internal_notes?: string;
  client_notes?: string;
  approved_by?: string;
  is_winner: boolean;
  created_at: string;
  updated_at: string;
  user_name?: string;
}

export const useAuctionBids = (auctionId: string) => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingBid, setSubmittingBid] = useState(false);
  const [pendingBidExists, setPendingBidExists] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchBids = async () => {
    if (!auctionId) return;

    try {
      // Fetch bids with user profile information
      const { data, error } = await supabase
        .from('bids')
        .select(`
          *,
          user_profile:profiles!bids_user_id_fkey(name)
        `)
        .eq('auction_id', auctionId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedBids = (data || []).map((bid: any) => ({
        ...bid,
        user_name: bid.user_profile?.name || 'Usuário desconhecido'
      }));

      setBids(formattedBids);

      // Verificar se existe lance pendente do usuário atual
      if (user?.id) {
        const userHasPendingBid = formattedBids.some((bid: Bid) => 
          bid.user_id === user.id && bid.status === 'pending'
        );
        setPendingBidExists(userHasPendingBid);
      }

    } catch (error) {
      console.error('Error fetching bids:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os lances",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const submitBid = async (bidValue: number) => {
    if (!user || !auctionId) {
      toast({
        title: "Erro", 
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return false;
    }

    if (pendingBidExists) {
      toast({
        title: "Lance em análise",
        description: "Aguarde a análise do seu lance atual",
        variant: "destructive"
      });
      return false;
    }

    setSubmittingBid(true);

    try {
      // Verificar se o usuário tem lance pendente antes de enviar
      const { data: existingBids } = await supabase
        .from('bids')
        .select('id')
        .eq('user_id', user.id)
        .eq('auction_id', auctionId)
        .eq('status', 'pending');

      if (existingBids && existingBids.length > 0) {
        toast({
          title: "Lance em análise",
          description: "Você já possui um lance aguardando análise",
          variant: "destructive"
        });
        return false;
      }

      // Buscar o auction_item correto para este leilão
      const { data: auctionItem, error: itemError } = await supabase
        .from('auction_items')
        .select('id')
        .eq('auction_id', auctionId)
        .eq('is_current', true)
        .maybeSingle();

      if (itemError) {
        console.error('Error fetching auction item:', itemError);
        throw new Error('Não foi possível encontrar o item do leilão');
      }

      if (!auctionItem) {
        throw new Error('Nenhum item ativo encontrado para este leilão');
      }

      const { data, error } = await supabase
        .from('bids')
        .insert([{
          user_id: user.id,
          auction_id: auctionId,
          auction_item_id: auctionItem.id,
          bid_value: bidValue,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      toast({
        title: "Lance enviado",
        description: "Seu lance foi enviado para análise",
      });

      await fetchBids();
      return true;

    } catch (error: any) {
      console.error('Error submitting bid:', error);
      
      let errorMessage = "Não foi possível enviar o lance";
      if (error?.message?.includes('duplicate')) {
        errorMessage = "Você já possui um lance para este leilão";
      } else if (error?.message) {
        errorMessage = `Erro: ${error.message}`;
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    } finally {
      setSubmittingBid(false);
    }
  };

  useEffect(() => {
    fetchBids();

    // Clean up existing channel
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    // Create new channel only if none exists
    if (!channelRef.current && auctionId) {
      const channelId = `auction-bids-${auctionId}-${Math.random().toString(36).substr(2, 9)}`;
      channelRef.current = supabase
        .channel(channelId)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'bids',
          filter: `auction_id=eq.${auctionId}`
        }, () => {
          fetchBids();
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'auctions',
          filter: `id=eq.${auctionId}`
        }, () => {
          fetchBids();
        })
        .subscribe();
    }

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [auctionId]);

  const userPendingBid = bids.find(bid => bid.user_id === user?.id && bid.status === 'pending');

  return {
    bids,
    loading,
    submitBid,
    submittingBid,
    pendingBidExists,
    userPendingBid,
    refetch: fetchBids
  };
};