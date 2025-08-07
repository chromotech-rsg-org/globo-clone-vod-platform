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

// Global registry to track active channels
const activeNotificationChannels = new Map<string, any>();

export const usePendingNotifications = () => {
  const [pendingBids, setPendingBids] = useState<PendingItem[]>([]);
  const [pendingRegistrations, setPendingRegistrations] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const mounted = useRef(true);

  const fetchPendingItems = useCallback(async () => {
    if (!user || !mounted.current) return;

    try {
      console.log('🔄 fetchPendingItems: Starting fetch for user:', user.id);

      // Buscar lances pendentes usando foreign key explícita
      const { data: bidsData, error: bidsError } = await supabase
        .from('bids')
        .select(`
          id,
          bid_value,
          created_at,
          auction:auctions!bids_auction_id_fkey(name),
          user_profile:profiles!bids_user_id_fkey(name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (bidsError) {
        console.error('❌ fetchPendingItems: Bids error:', bidsError);
        throw bidsError;
      }

      console.log('✅ fetchPendingItems: Bids data:', bidsData);

      // Buscar habilitações pendentes usando foreign key explícita
      const { data: registrationsData, error: registrationsError } = await supabase
        .from('auction_registrations')
        .select(`
          id,
          created_at,
          auction:auctions!auction_registrations_auction_id_fkey(name),
          user_profile:profiles!auction_registrations_user_id_fkey(name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (registrationsError) {
        console.error('❌ fetchPendingItems: Registrations error:', registrationsError);
        throw registrationsError;
      }

      console.log('✅ fetchPendingItems: Registrations data:', registrationsData);

      if (!mounted.current) return;

      // Formatar dados dos lances
      const formattedBids: PendingItem[] = (bidsData || []).map((bid: any) => ({
        id: bid.id,
        type: 'bid' as const,
        auction_name: bid.auction?.name || 'Leilão desconhecido',
        user_name: bid.user_profile?.name || 'Usuário desconhecido',
        value: bid.bid_value,
        created_at: bid.created_at
      }));

      // Formatar dados das habilitações
      const formattedRegistrations: PendingItem[] = (registrationsData || []).map((registration: any) => ({
        id: registration.id,
        type: 'registration' as const,
        auction_name: registration.auction?.name || 'Leilão desconhecido',
        user_name: registration.user_profile?.name || 'Usuário desconhecido',
        created_at: registration.created_at
      }));

      console.log('✅ fetchPendingItems: Formatted bids:', formattedBids.length);
      console.log('✅ fetchPendingItems: Formatted registrations:', formattedRegistrations.length);

      setPendingBids(formattedBids);
      setPendingRegistrations(formattedRegistrations);
    } catch (error) {
      console.error('❌ fetchPendingItems: Final error:', error);
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

    const channelKey = `pending-notifications-${user.id}`;
    
    // Check if channels already exist
    if (activeNotificationChannels.has(channelKey)) {
      console.log('🔄 usePendingNotifications: Channels already exist for user:', user.id);
      return;
    }

    console.log('🔄 usePendingNotifications: Creating new channels for user:', user.id);

    // Create stable callback to avoid dependency issues
    const handlePendingChange = () => {
      console.log('🔄 usePendingNotifications: Realtime change detected for user:', user.id);
      if (mounted.current) {
        fetchPendingItems();
      }
    };

    // Create channels with unique IDs
    const bidsChannel = supabase
      .channel(`pending-bids-${user.id}-${Date.now()}-${Math.random()}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bids',
        filter: 'status=eq.pending'
      }, handlePendingChange);

    const registrationsChannel = supabase
      .channel(`pending-registrations-${user.id}-${Date.now()}-${Math.random()}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'auction_registrations',
        filter: 'status=eq.pending'
      }, handlePendingChange);

    // Store channels in registry
    activeNotificationChannels.set(channelKey, { bidsChannel, registrationsChannel });
    
    // Subscribe to channels
    bidsChannel.subscribe();
    registrationsChannel.subscribe();
    console.log('✅ usePendingNotifications: Channels subscribed for user:', user.id);

    return () => {
      console.log('🧹 usePendingNotifications: Cleaning up channels for user:', user.id);
      mounted.current = false;
      
      // Clean up channels
      const storedChannels = activeNotificationChannels.get(channelKey);
      if (storedChannels) {
        activeNotificationChannels.delete(channelKey);
        supabase.removeChannel(storedChannels.bidsChannel);
        supabase.removeChannel(storedChannels.registrationsChannel);
        console.log('✅ usePendingNotifications: Channels cleaned up for user:', user.id);
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