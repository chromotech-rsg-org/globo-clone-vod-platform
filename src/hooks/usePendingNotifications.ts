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
          auctions(name),
          profiles(name)
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
          auctions(name),
          profiles(name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (registrationsError) throw registrationsError;

      // Formatar dados dos lances
      const formattedBids: PendingItem[] = (bidsData || []).map((bid: any) => ({
        id: bid.id,
        type: 'bid' as const,
        auction_name: bid.auctions?.name || 'Leilão desconhecido',
        user_name: bid.profiles?.name || 'Usuário desconhecido',
        value: bid.bid_value,
        created_at: bid.created_at
      }));

      // Formatar dados das habilitações
      const formattedRegistrations: PendingItem[] = (registrationsData || []).map((registration: any) => ({
        id: registration.id,
        type: 'registration' as const,
        auction_name: registration.auctions?.name || 'Leilão desconhecido',
        user_name: registration.profiles?.name || 'Usuário desconhecido',
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

    // Clean up existing channels first
    if (bidsChannelRef.current) {
      supabase.removeChannel(bidsChannelRef.current);
      bidsChannelRef.current = null;
    }
    if (registrationsChannelRef.current) {
      supabase.removeChannel(registrationsChannelRef.current);
      registrationsChannelRef.current = null;
    }

    // Only create channels if user exists and channels don't exist
    if (user && !bidsChannelRef.current) {
      const bidsChannelId = `pending-bids-${user.id}-${Date.now()}`;
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

    if (user && !registrationsChannelRef.current) {
      const registrationsChannelId = `pending-registrations-${user.id}-${Date.now()}`;
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
        supabase.removeChannel(bidsChannelRef.current);
        bidsChannelRef.current = null;
      }
      if (registrationsChannelRef.current) {
        supabase.removeChannel(registrationsChannelRef.current);
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