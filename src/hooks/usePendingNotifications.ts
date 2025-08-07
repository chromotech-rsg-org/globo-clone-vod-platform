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

    try {
      // Buscar lances pendentes com queries separadas
      const { data: bidsData, error: bidsError } = await supabase
        .from('bids')
        .select('id, bid_value, created_at, auction_id, user_id')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (bidsError) {
        console.error('Erro ao buscar lances:', bidsError);
        setPendingBids([]);
      }

      // Buscar registros pendentes com queries separadas
      const { data: registrationsData, error: registrationsError } = await supabase
        .from('auction_registrations')
        .select('id, created_at, auction_id, user_id')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (registrationsError) {
        console.error('Erro ao buscar registros:', registrationsError);
        setPendingRegistrations([]);
      }

      if (!mounted.current) return;

      // Buscar dados relacionados se necessário
      let formattedBids: PendingItem[] = [];
      let formattedRegistrations: PendingItem[] = [];

      if (bidsData && bidsData.length > 0) {
        const auctionIds = [...new Set(bidsData.map(bid => bid.auction_id))];
        const userIds = [...new Set(bidsData.map(bid => bid.user_id))];

        const [auctionsResponse, profilesResponse] = await Promise.all([
          supabase.from('auctions').select('id, name').in('id', auctionIds),
          supabase.from('profiles').select('id, name').in('id', userIds)
        ]);

        const auctionsMap = new Map(auctionsResponse.data?.map(a => [a.id, a.name]) || []);
        const profilesMap = new Map(profilesResponse.data?.map(p => [p.id, p.name]) || []);

        formattedBids = bidsData.map((bid: any) => ({
          id: bid.id,
          type: 'bid' as const,
          auction_name: auctionsMap.get(bid.auction_id) || 'Leilão desconhecido',
          user_name: profilesMap.get(bid.user_id) || 'Usuário desconhecido',
          value: bid.bid_value,
          created_at: bid.created_at
        }));
      }

      if (registrationsData && registrationsData.length > 0) {
        const auctionIds = [...new Set(registrationsData.map(reg => reg.auction_id))];
        const userIds = [...new Set(registrationsData.map(reg => reg.user_id))];

        const [auctionsResponse, profilesResponse] = await Promise.all([
          supabase.from('auctions').select('id, name').in('id', auctionIds),
          supabase.from('profiles').select('id, name').in('id', userIds)
        ]);

        const auctionsMap = new Map(auctionsResponse.data?.map(a => [a.id, a.name]) || []);
        const profilesMap = new Map(profilesResponse.data?.map(p => [p.id, p.name]) || []);

        formattedRegistrations = registrationsData.map((registration: any) => ({
          id: registration.id,
          type: 'registration' as const,
          auction_name: auctionsMap.get(registration.auction_id) || 'Leilão desconhecido',
          user_name: profilesMap.get(registration.user_id) || 'Usuário desconhecido',
          created_at: registration.created_at
        }));
      }

      setPendingBids(formattedBids);
      setPendingRegistrations(formattedRegistrations);
    } catch (error) {
      console.error('Erro geral ao buscar dados pendentes:', error);
      setPendingBids([]);
      setPendingRegistrations([]);
    } finally {
      if (mounted.current) {
        setLoading(false);
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