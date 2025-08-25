
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuctionStats {
  totalBids: number;
  hasWinner: boolean;
  winnerBidValue?: number;
  initialBidValue: number;
  currentBidValue: number;
}

export const useAuctionStats = (auctionId: string) => {
  const [stats, setStats] = useState<AuctionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStats = async () => {
    if (!auctionId) return;
    
    try {
      setLoading(true);
      
      // Buscar informações do leilão
      const { data: auction, error: auctionError } = await supabase
        .from('auctions')
        .select('initial_bid_value, current_bid_value')
        .eq('id', auctionId)
        .single();

      if (auctionError) throw auctionError;

      // Buscar estatísticas dos lances
      const { data: bids, error: bidsError } = await supabase
        .from('bids')
        .select('bid_value, is_winner, status')
        .eq('auction_id', auctionId);

      if (bidsError) throw bidsError;

      const totalBids = bids?.length || 0;
      const winnerBid = bids?.find(bid => bid.is_winner);
      const hasWinner = !!winnerBid;
      const winnerBidValue = winnerBid?.bid_value;

      setStats({
        totalBids,
        hasWinner,
        winnerBidValue,
        initialBidValue: auction.initial_bid_value,
        currentBidValue: auction.current_bid_value
      });
    } catch (error) {
      console.error('Error fetching auction stats:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as estatísticas do leilão",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [auctionId]);

  return { stats, loading, refetch: fetchStats };
};
