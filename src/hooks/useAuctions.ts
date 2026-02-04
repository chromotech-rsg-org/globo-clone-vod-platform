import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Auction } from '@/types/auction';
import { useToast } from '@/components/ui/use-toast';
import { createInstanceId } from '@/utils/realtime';

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
  const instanceIdRef = useRef<string>('');
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
    // Create stable instance ID
    if (!instanceIdRef.current) {
      instanceIdRef.current = createInstanceId();
    }

    if (auctionId) {
      fetchAuction();
      
      // Set up real-time subscription for auction changes with unique channel
      const channelName = `auction-details-${auctionId}-${instanceIdRef.current}`;
      console.log(`📡 [useAuctionDetails] Creating channel: ${channelName}`);
      
      const subscription = supabase
        .channel(channelName)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'auctions',
          filter: `id=eq.${auctionId}`
        }, (payload) => {
          console.log('🔔 [useAuctionDetails] Real-time auction update:', payload);
          
          // Atualização imediata com dados do payload
          if (payload.eventType === 'UPDATE' && payload.new) {
            console.log('✨ [useAuctionDetails] Atualizando leilão imediatamente:', payload.new);
            setAuction(payload.new as Auction);
          }
          
          // Também fazer refetch para garantir consistência
          fetchAuction();
        })
        .subscribe((status) => {
          console.log(`📡 [useAuctionDetails] Subscription status: ${status}`);
        });

      return () => {
        console.log(`📡 [useAuctionDetails] Removing channel: ${channelName}`);
        supabase.removeChannel(subscription);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auctionId]);

  return { auction, loading, refetch: fetchAuction };
};