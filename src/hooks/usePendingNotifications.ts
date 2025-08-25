
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getUniqueChannelId, clearNotificationCache } from '@/utils/notificationCache';
import { isProductionCustomDomain } from '@/utils/domainHealth';
import { clearVercelCache } from '@/utils/vercelOptimizations';

interface PendingItem {
  id: string;
  type: 'bid' | 'registration';
  auction_name: string;
  user_name: string;
  value?: number;
  created_at: string;
  isNew?: boolean;
}

export const usePendingNotifications = () => {
  const [pendingBids, setPendingBids] = useState<PendingItem[]>([]);
  const [pendingRegistrations, setPendingRegistrations] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [lastTotalCount, setLastTotalCount] = useState(0);
  const { user } = useAuth();
  const mounted = useRef(true);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = isProductionCustomDomain() ? 5 : 3;

  const fetchPendingItems = useCallback(async () => {
    if (!user || !mounted.current) return;

    console.log('🔄 usePendingNotifications: Iniciando busca para usuário:', user.id);
    
    try {
      if (isProductionCustomDomain()) {
        clearVercelCache();
        clearNotificationCache();
      }
      
      const timestamp = Date.now();
      console.log('⏰ usePendingNotifications: Cache-busting timestamp:', timestamp);

      // Buscar lances pendentes
      const { data: bidsData, error: bidsError } = await supabase
        .from('bids')
        .select('id, bid_value, created_at, auction_id, user_id')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (bidsError) {
        console.error('❌ usePendingNotifications: Erro ao buscar lances:', bidsError);
        if (retryCount < maxRetries) {
          console.log(`🔄 usePendingNotifications: Tentativa ${retryCount + 1} de ${maxRetries}`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            fetchPendingItems();
          }, 1000 * (retryCount + 1));
          return;
        }
        setPendingBids([]);
      } else {
        setRetryCount(0);
        console.log('✅ usePendingNotifications: Lances pendentes encontrados:', bidsData?.length || 0);
      }

      // Buscar registros pendentes
      const { data: registrationsData, error: registrationsError } = await supabase
        .from('auction_registrations')
        .select('id, created_at, auction_id, user_id')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (registrationsError) {
        console.error('❌ usePendingNotifications: Erro ao buscar registros:', registrationsError);
        if (retryCount < maxRetries) {
          console.log(`🔄 usePendingNotifications: Tentativa ${retryCount + 1} de ${maxRetries} para registros`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            fetchPendingItems();
          }, 1000 * (retryCount + 1));
          return;
        }
        setPendingRegistrations([]);
      } else {
        console.log('✅ usePendingNotifications: Registros pendentes encontrados:', registrationsData?.length || 0);
      }

      if (!mounted.current) return;

      // Processar lances se existirem
      let formattedBids: PendingItem[] = [];
      if (bidsData && bidsData.length > 0) {
        try {
          const auctionIds = [...new Set(bidsData.map(bid => bid.auction_id))];
          const userIds = [...new Set(bidsData.map(bid => bid.user_id))];

          console.log('🔍 usePendingNotifications: Buscando dados relacionados para lances');

          const [auctionsResponse, profilesResponse] = await Promise.all([
            supabase.from('auctions').select('id, name').in('id', auctionIds),
            supabase.from('profiles').select('id, name').in('id', userIds)
          ]);

          const auctionsMap = new Map(auctionsResponse.data?.map(a => [a.id, a.name]) || []);
          const profilesMap = new Map(profilesResponse.data?.map(p => [p.id, p.name]) || []);

          formattedBids = bidsData.map((bid: any) => ({
            id: bid.id,
            type: 'bid' as const,
            auction_name: auctionsMap.get(bid.auction_id) || `Leilão ${bid.auction_id.slice(-4)}`,
            user_name: profilesMap.get(bid.user_id) || `Usuário ${bid.user_id.slice(-4)}`,
            value: bid.bid_value,
            created_at: bid.created_at,
            isNew: false // Will be set by real-time updates
          }));
        } catch (error) {
          console.error('⚠️ usePendingNotifications: Erro ao processar lances:', error);
          formattedBids = [];
        }
      }

      // Processar registros se existirem
      let formattedRegistrations: PendingItem[] = [];
      if (registrationsData && registrationsData.length > 0) {
        try {
          const auctionIds = [...new Set(registrationsData.map(reg => reg.auction_id))];
          const userIds = [...new Set(registrationsData.map(reg => reg.user_id))];

          console.log('🔍 usePendingNotifications: Buscando dados relacionados para registros');

          const [auctionsResponse, profilesResponse] = await Promise.all([
            supabase.from('auctions').select('id, name').in('id', auctionIds),
            supabase.from('profiles').select('id, name').in('id', userIds)
          ]);

          const auctionsMap = new Map(auctionsResponse.data?.map(a => [a.id, a.name]) || []);
          const profilesMap = new Map(profilesResponse.data?.map(p => [p.id, p.name]) || []);

          formattedRegistrations = registrationsData.map((registration: any) => ({
            id: registration.id,
            type: 'registration' as const,
            auction_name: auctionsMap.get(registration.auction_id) || `Leilão ${registration.auction_id.slice(-4)}`,
            user_name: profilesMap.get(registration.user_id) || `Usuário ${registration.user_id.slice(-4)}`,
            created_at: registration.created_at,
            isNew: false // Will be set by real-time updates
          }));
        } catch (error) {
          console.error('⚠️ usePendingNotifications: Erro ao processar registros:', error);
          formattedRegistrations = [];
        }
      }

      // Check for new notifications
      const currentTotal = formattedBids.length + formattedRegistrations.length;
      if (lastTotalCount > 0 && currentTotal > lastTotalCount) {
        setHasNewNotifications(true);
        // Reset after 5 seconds
        setTimeout(() => setHasNewNotifications(false), 5000);
      }
      setLastTotalCount(currentTotal);

      setPendingBids(formattedBids);
      setPendingRegistrations(formattedRegistrations);
      
      console.log('✅ usePendingNotifications: Processamento concluído:', {
        lances: formattedBids.length,
        registros: formattedRegistrations.length,
        total: formattedBids.length + formattedRegistrations.length
      });

    } catch (error) {
      console.error('💥 usePendingNotifications: Erro geral:', error);
      setPendingBids([]);
      setPendingRegistrations([]);
    } finally {
      if (mounted.current) {
        setLoading(false);
        console.log('✨ usePendingNotifications: Busca finalizada');
      }
    }
  }, [user, retryCount, maxRetries, lastTotalCount]);

  useEffect(() => {
    if (!user) return;
    
    mounted.current = true;
    
    if (isProductionCustomDomain()) {
      clearVercelCache();
    }
    clearNotificationCache();
    
    fetchPendingItems();

    const channelName = getUniqueChannelId(user.id);
    
    const handlePendingChange = (payload: any) => {
      if (mounted.current) {
        console.log('🔔 usePendingNotifications: Real-time change detected:', payload);
        if (isProductionCustomDomain()) {
          clearVercelCache();
        }
        clearNotificationCache();
        
        // Mark as new notification and trigger immediate refresh for status changes
        if (payload.eventType === 'UPDATE' && 
            (payload.new?.status === 'approved' || payload.new?.status === 'rejected')) {
          setHasNewNotifications(true);
          setTimeout(() => setHasNewNotifications(false), 5000);
          // Immediate refresh for approvals/rejections
          fetchPendingItems();
        } else if (payload.eventType === 'INSERT') {
          setHasNewNotifications(true);
          setTimeout(() => setHasNewNotifications(false), 5000);
          // Small delay for inserts to ensure data consistency
          setTimeout(() => {
            fetchPendingItems();
          }, 500);
        }
      }
    };

    let subscription: any;
    
    try {
      subscription = supabase
        .channel(channelName)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'bids'
        }, handlePendingChange)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'auction_registrations'
        }, handlePendingChange)
        .subscribe();
    } catch (error) {
      console.error('❌ Failed to setup notification subscription:', error);
      
      if (isProductionCustomDomain()) {
        console.log('🔄 Falling back to polling for notifications on production domain');
        const pollInterval = setInterval(() => {
          if (mounted.current) {
            fetchPendingItems();
          }
        }, 15000);
        
        return () => {
          clearInterval(pollInterval);
          mounted.current = false;
        };
      }
    }

    return () => {
      mounted.current = false;
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [user?.id, fetchPendingItems]);

  const totalPending = pendingBids.length + pendingRegistrations.length;

  return {
    pendingBids,
    pendingRegistrations,
    totalPending,
    loading,
    hasNewNotifications,
    refetch: fetchPendingItems
  };
};
