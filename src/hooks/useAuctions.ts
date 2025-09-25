import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Auction } from '@/types/auction';
import { useToast } from '@/components/ui/use-toast';

export const useAuctions = () => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAuctions = async () => {
    try {
        const { data, error } = await supabase
          .from('auctions')
          .select('*')
          .order('created_at', { ascending: false });

      if (error) throw error;
      setAuctions(data as Auction[] || []);
    } catch (error) {
      console.error('Error fetching auctions:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os leilões",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel(`auctions-list-${Math.random().toString(36).substring(7)}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'auctions'
      }, () => {
        fetchAuctions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return { auctions, loading, refetch: fetchAuctions };
};

export const useAuctionDetails = (auctionId: string) => {
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAuction = async () => {
    try {
        const { data, error } = await supabase
          .from('auctions')
          .select('*')
          .eq('id', auctionId)
          .single();

      if (error) throw error;
      setAuction(data as Auction);
    } catch (error) {
      console.error('Error fetching auction:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o leilão",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auctionId) {
      fetchAuction();
      
      // Set up real-time subscription for auction changes
      const subscription = supabase
        .channel(`auction-details-${auctionId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'auctions',
          filter: `id=eq.${auctionId}`
        }, () => {
          fetchAuction();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [auctionId]);

  return { auction, loading, refetch: fetchAuction };
};