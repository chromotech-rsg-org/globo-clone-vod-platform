
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Bid } from '@/types/auction';
import { useAuth } from '@/contexts/AuthContext';
import { getUniqueChannelId, clearNotificationCache } from '@/utils/notificationCache';
import { isProductionCustomDomain } from '@/utils/domainHealth';
import { clearVercelCache } from '@/utils/vercelOptimizations';

export const useAuctionBids = (auctionItemId?: string) => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchBids = async () => {
    if (!auctionItemId) {
      setBids([]);
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 useAuctionBids: Buscando lances para item:', auctionItemId);
      
      if (isProductionCustomDomain()) {
        clearVercelCache();
        clearNotificationCache();
      }

      const { data, error } = await supabase
        .from('bids')
        .select(`
          *,
          profiles!bids_user_id_fkey (name)
        `)
        .eq('auction_item_id', auctionItemId)
        .order('created_at', { ascending: false });

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const bidsWithUserNames = (data || []).map(bid => ({
        ...bid,
        user_name: bid.profiles?.name || 'Usuário'
      }));

      console.log('✅ useAuctionBids: Lances encontrados:', bidsWithUserNames.length);
      setBids(bidsWithUserNames);
    } catch (error) {
      console.error('❌ useAuctionBids: Erro ao buscar lances:', error);
      setBids([]); // Clear bids on error instead of keeping old data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!auctionItemId) {
      setBids([]);
      return;
    }

    console.log('🎯 useAuctionBids: Inicializando para item:', auctionItemId);
    
    if (isProductionCustomDomain()) {
      clearVercelCache();
    }
    clearNotificationCache();
    
    fetchBids();

    // Setup real-time subscription
    const channelName = getUniqueChannelId(`bids-${auctionItemId}`);
    
    const handleBidsChange = (payload: any) => {
      console.log('🔔 useAuctionBids: Mudança detectada:', payload);
      
      if (isProductionCustomDomain()) {
        clearVercelCache();
      }
      clearNotificationCache();
      
      // Refresh bids on any change
      setTimeout(() => {
        fetchBids();
      }, 500);
    };

    let subscription: any;
    
    try {
      subscription = supabase
        .channel(channelName)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'bids',
          filter: `auction_item_id=eq.${auctionItemId}`
        }, handleBidsChange)
        .subscribe((status) => {
          console.log('📡 useAuctionBids: Subscription status:', status);
        });
        
    } catch (error) {
      console.error('❌ useAuctionBids: Erro ao configurar subscription:', error);
      
      // Fallback para polling em caso de erro
      if (isProductionCustomDomain()) {
        console.log('🔄 useAuctionBids: Fallback para polling');
        const pollInterval = setInterval(() => {
          fetchBids();
        }, 10000);
        
        return () => {
          clearInterval(pollInterval);
        };
      }
    }

    return () => {
      if (subscription) {
        console.log('🔌 useAuctionBids: Removendo subscription');
        supabase.removeChannel(subscription);
      }
    };
  }, [auctionItemId]);

  return { bids, loading, refetch: fetchBids };
};
