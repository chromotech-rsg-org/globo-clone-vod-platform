import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { RealtimeChannel } from '@supabase/supabase-js';

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
  const bidsChannelRef = useRef<RealtimeChannel | null>(null);
  const registrationsChannelRef = useRef<RealtimeChannel | null>(null);

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
          auctions!bids_auction_id_fkey(name),
          user_profile:profiles!bids_user_id_fkey(name)
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
          auctions!auction_registrations_auction_id_fkey(name),
          user_profile:profiles!auction_registrations_user_id_fkey(name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (registrationsError) throw registrationsError;

      // Formatar dados dos lances
      const formattedBids: PendingItem[] = (bidsData || []).map((bid: any) => ({
        id: bid.id,
        type: 'bid' as const,
        auction_name: bid.auctions.name,
        user_name: bid.user_profile?.name || 'Usuário desconhecido',
        value: bid.bid_value,
        created_at: bid.created_at
      }));

      // Formatar dados das habilitações
      const formattedRegistrations: PendingItem[] = (registrationsData || []).map((registration: any) => ({
        id: registration.id,
        type: 'registration' as const,
        auction_name: registration.auctions.name,
        user_name: registration.user_profile?.name || 'Usuário desconhecido',
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

    // Clean up existing channels
    if (bidsChannelRef.current) {
      bidsChannelRef.current.unsubscribe();
      bidsChannelRef.current = null;
    }
    if (registrationsChannelRef.current) {
      registrationsChannelRef.current.unsubscribe();
      registrationsChannelRef.current = null;
    }

    // Create new channels only if they don't exist
    if (!bidsChannelRef.current) {
      const bidsChannelId = `pending-bids-${Math.random().toString(36).substr(2, 9)}`;
      bidsChannelRef.current = supabase
        .channel(bidsChannelId)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'bids',
          filter: 'status=eq.pending'
        }, () => {
          fetchPendingItems();
        })
        .subscribe();
    }

    if (!registrationsChannelRef.current) {
      const registrationsChannelId = `pending-registrations-${Math.random().toString(36).substr(2, 9)}`;
      registrationsChannelRef.current = supabase
        .channel(registrationsChannelId)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'auction_registrations',
          filter: 'status=eq.pending'
        }, () => {
          fetchPendingItems();
        })
        .subscribe();
    }

    return () => {
      if (bidsChannelRef.current) {
        bidsChannelRef.current.unsubscribe();
        bidsChannelRef.current = null;
      }
      if (registrationsChannelRef.current) {
        registrationsChannelRef.current.unsubscribe();
        registrationsChannelRef.current = null;
      }
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