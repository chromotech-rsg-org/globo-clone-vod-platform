
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { getUniqueChannelId, clearNotificationCache } from '@/utils/notificationCache';
import { isProductionCustomDomain } from '@/utils/domainHealth';
import { clearVercelCache } from '@/utils/vercelOptimizations';

interface PendingItem {
  id: string;
  type: 'bid' | 'registration' | 'limit_request';
  auction_name?: string;
  user_name: string;
  value?: number;
  created_at: string;
  isNew?: boolean;
  isReactivationAfterManualDisable?: boolean;
  requested_limit?: number;
  current_limit?: number;
}

export const usePendingNotifications = () => {
  const [pendingBids, setPendingBids] = useState<PendingItem[]>([]);
  const [pendingRegistrations, setPendingRegistrations] = useState<PendingItem[]>([]);
  const [pendingLimitRequests, setPendingLimitRequests] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [lastTotalCount, setLastTotalCount] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();
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
        .select('id, created_at, auction_id, user_id, manually_disabled_by, manually_disabled_at, client_notes')
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

      // Buscar solicitações de aumento de limite pendentes
      const { data: limitRequestsData, error: limitRequestsError } = await supabase
        .from('limit_increase_requests')
        .select('id, user_id, current_limit, requested_limit, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (limitRequestsError) {
        console.error('❌ usePendingNotifications: Erro ao buscar solicitações de limite:', limitRequestsError);
        setPendingLimitRequests([]);
      } else {
        console.log('✅ usePendingNotifications: Solicitações de limite encontradas:', limitRequestsData?.length || 0);
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
            isNew: false, // Will be set by real-time updates
            isReactivationAfterManualDisable: Boolean(registration.manually_disabled_by && registration.client_notes?.includes('reativação após desativação manual'))
          }));
        } catch (error) {
          console.error('⚠️ usePendingNotifications: Erro ao processar registros:', error);
          formattedRegistrations = [];
        }
      }

      // Processar solicitações de limite se existirem
      let formattedLimitRequests: PendingItem[] = [];
      if (limitRequestsData && limitRequestsData.length > 0) {
        try {
          const userIds = [...new Set(limitRequestsData.map(req => req.user_id))];

          console.log('🔍 usePendingNotifications: Buscando dados relacionados para solicitações de limite');

          const profilesResponse = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', userIds);

          const profilesMap = new Map(profilesResponse.data?.map(p => [p.id, p.name]) || []);

          formattedLimitRequests = limitRequestsData.map((request: any) => ({
            id: request.id,
            type: 'limit_request' as const,
            user_name: profilesMap.get(request.user_id) || `Usuário ${request.user_id.slice(-4)}`,
            created_at: request.created_at,
            requested_limit: request.requested_limit,
            current_limit: request.current_limit,
            isNew: false
          }));
        } catch (error) {
          console.error('⚠️ usePendingNotifications: Erro ao processar solicitações de limite:', error);
          formattedLimitRequests = [];
        }
      }

      // Check for new notifications
      const currentTotal = formattedBids.length + formattedRegistrations.length + formattedLimitRequests.length;
      if (lastTotalCount > 0 && currentTotal > lastTotalCount) {
        setHasNewNotifications(true);
        // Reset after 5 seconds
        setTimeout(() => setHasNewNotifications(false), 5000);
      }
      setLastTotalCount(currentTotal);

      setPendingBids(formattedBids);
      setPendingRegistrations(formattedRegistrations);
      setPendingLimitRequests(formattedLimitRequests);
      
      console.log('✅ usePendingNotifications: Processamento concluído:', {
        lances: formattedBids.length,
        registros: formattedRegistrations.length,
        limitRequests: formattedLimitRequests.length,
        total: formattedBids.length + formattedRegistrations.length + formattedLimitRequests.length
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
        
        // For approvals/rejections, trigger immediate refresh and REMOVE from pending list
        if (payload.eventType === 'UPDATE' && 
            (payload.new?.status === 'approved' || payload.new?.status === 'rejected')) {
          console.log('🎯 usePendingNotifications: Status change detected, removing from pending list immediately');
          
          // Immediately remove from state for instant UI update
          if (payload.table === 'auction_registrations') {
            setPendingRegistrations(prev => prev.filter(item => item.id !== payload.new.id));
          } else if (payload.table === 'limit_increase_requests') {
            setPendingLimitRequests(prev => prev.filter(item => item.id !== payload.new.id));
          } else if (payload.table === 'bids') {
            setPendingBids(prev => prev.filter(item => item.id !== payload.new.id));
          }
          
          // Then fetch for accuracy
          fetchPendingItems();
        } else if (payload.eventType === 'INSERT') {
          console.log('📥 usePendingNotifications: Nova solicitação detectada!');
          
          // Mostrar toast para admin sobre nova solicitação
          if (payload.table === 'auction_registrations') {
            toast({
              title: "Nova Solicitação de Habilitação! 🔔",
              description: "Um cliente solicitou habilitação para participar do leilão.",
            });
          } else if (payload.table === 'limit_increase_requests') {
            toast({
              title: "Nova Solicitação de Aumento de Limite! 🔔",
              description: "Um cliente solicitou aumento do limite de lance.",
            });
          } else if (payload.table === 'bids') {
            toast({
              title: "Novo Lance Recebido! 🔔",
              description: "Um novo lance foi recebido e está aguardando análise.",
            });
          }
          
          setHasNewNotifications(true);
          setTimeout(() => setHasNewNotifications(false), 5000);
          // Immediate refresh for inserts
          fetchPendingItems();
        } else {
          // For other events, still refresh immediately
          fetchPendingItems();
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
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'limit_increase_requests'
        }, handlePendingChange)
        .subscribe((status) => {
          console.log('📡 usePendingNotifications: Realtime subscription status:', status);
        });
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

  const totalPending = pendingBids.length + pendingRegistrations.length + pendingLimitRequests.length;

  return {
    pendingBids,
    pendingRegistrations,
    pendingLimitRequests,
    totalPending,
    loading,
    hasNewNotifications,
    refetch: fetchPendingItems
  };
};
