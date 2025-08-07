import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PendingItem {
  id: string;
  type: 'bid' | 'registration';
  auction_name: string;
  user_name: string;
  value?: number;
  created_at: string;
}

export const usePendingNotifications = () => {
  const [pendingBids, setPendingBids] = useState<PendingItem[]>([]);
  const [pendingRegistrations, setPendingRegistrations] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const mounted = useRef(true);

  const fetchPendingItems = useCallback(async () => {
    if (!user || !mounted.current) return;

    console.log('🔄 usePendingNotifications: Iniciando busca para usuário:', user.id);
    
    try {
      // Buscar lances pendentes apenas
      const { data: bidsData, error: bidsError } = await supabase
        .from('bids')
        .select('id, bid_value, created_at, auction_id, user_id')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (bidsError) {
        console.error('❌ usePendingNotifications: Erro ao buscar lances:', bidsError);
        setPendingBids([]);
      } else {
        console.log('✅ usePendingNotifications: Lances pendentes encontrados:', bidsData?.length || 0);
      }

      // Buscar registros pendentes apenas
      const { data: registrationsData, error: registrationsError } = await supabase
        .from('auction_registrations')
        .select('id, created_at, auction_id, user_id')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (registrationsError) {
        console.error('❌ usePendingNotifications: Erro ao buscar registros:', registrationsError);
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
            created_at: bid.created_at
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
            created_at: registration.created_at
          }));
        } catch (error) {
          console.error('⚠️ usePendingNotifications: Erro ao processar registros:', error);
          formattedRegistrations = [];
        }
      }

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
  }, [user]);

  useEffect(() => {
    if (!user) return;
    
    mounted.current = true;
    fetchPendingItems();

    // Simplified real-time subscription
    const handlePendingChange = () => {
      if (mounted.current) {
        fetchPendingItems();
      }
    };

    const bidsChannel = supabase
      .channel(`pending-bids-${Date.now()}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bids',
        filter: 'status=eq.pending'
      }, handlePendingChange)
      .subscribe();

    const registrationsChannel = supabase
      .channel(`pending-registrations-${Date.now()}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'auction_registrations',
        filter: 'status=eq.pending'
      }, handlePendingChange)
      .subscribe();

    return () => {
      mounted.current = false;
      supabase.removeChannel(bidsChannel);
      supabase.removeChannel(registrationsChannel);
    };
  }, [user, fetchPendingItems]);

  const totalPending = pendingBids.length + pendingRegistrations.length;

  return {
    pendingBids,
    pendingRegistrations,
    totalPending,
    loading,
    refetch: fetchPendingItems
  };
};