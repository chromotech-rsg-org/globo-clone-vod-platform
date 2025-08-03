import { useState, useEffect } from 'react';
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

  const fetchPendingItems = async () => {
    if (!user) return;

    try {
      // Buscar lances pendentes
      const { data: bidsData, error: bidsError } = await supabase
        .from('bids')
        .select(`
          id,
          bid_value,
          created_at,
          auction_id,
          user_id,
          auctions!inner(name),
          profiles!inner(name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (bidsError) throw bidsError;

      // Buscar habilitações pendentes
      const { data: registrationsData, error: registrationsError } = await supabase
        .from('auction_registrations')
        .select(`
          id,
          created_at,
          auction_id,
          user_id,
          auctions!inner(name),
          profiles!inner(name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (registrationsError) throw registrationsError;

      // Formatar dados dos lances
      const formattedBids: PendingItem[] = (bidsData || []).map((bid: any) => ({
        id: bid.id,
        type: 'bid' as const,
        auction_name: bid.auctions.name,
        user_name: bid.profiles.name,
        value: bid.bid_value,
        created_at: bid.created_at
      }));

      // Formatar dados das habilitações
      const formattedRegistrations: PendingItem[] = (registrationsData || []).map((registration: any) => ({
        id: registration.id,
        type: 'registration' as const,
        auction_name: registration.auctions.name,
        user_name: registration.profiles.name,
        created_at: registration.created_at
      }));

      setPendingBids(formattedBids);
      setPendingRegistrations(formattedRegistrations);
    } catch (error) {
      console.error('Error fetching pending notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingItems();

    // Configurar realtime para lances
    const bidsChannel = supabase
      .channel('pending-bids')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bids',
        filter: 'status=eq.pending'
      }, () => {
        fetchPendingItems();
      })
      .subscribe();

    // Configurar realtime para habilitações
    const registrationsChannel = supabase
      .channel('pending-registrations')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'auction_registrations',
        filter: 'status=eq.pending'
      }, () => {
        fetchPendingItems();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(bidsChannel);
      supabase.removeChannel(registrationsChannel);
    };
  }, [user]);

  const totalPending = pendingBids.length + pendingRegistrations.length;

  return {
    pendingBids,
    pendingRegistrations,
    totalPending,
    loading,
    refetch: fetchPendingItems
  };
};