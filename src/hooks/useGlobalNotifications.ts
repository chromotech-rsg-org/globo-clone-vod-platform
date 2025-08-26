
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface GlobalNotification {
  id: string;
  type: 'registration' | 'bid';
  status: string;
  auction_name: string;
  client_notes?: string;
  created_at: string;
  updated_at: string;
}

export const useGlobalNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<GlobalNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user?.id) return;

    try {
      console.log('🔔 Fetching global notifications for user:', user.id);

      // Fetch user's bids with status updates
      const { data: bidsData, error: bidsError } = await supabase
        .from('bids')
        .select(`
          id, status, client_notes, created_at, updated_at,
          auctions!inner(name)
        `)
        .eq('user_id', user.id)
        .in('status', ['approved', 'rejected'])
        .order('updated_at', { ascending: false });

      // Fetch user's registrations with status updates
      const { data: registrationsData, error: registrationsError } = await supabase
        .from('auction_registrations')
        .select(`
          id, status, client_notes, created_at, updated_at,
          auctions!inner(name)
        `)
        .eq('user_id', user.id)
        .in('status', ['approved', 'rejected'])
        .order('updated_at', { ascending: false });

      if (bidsError) throw bidsError;
      if (registrationsError) throw registrationsError;

      const formattedBids = (bidsData || []).map(bid => ({
        id: bid.id,
        type: 'bid' as const,
        status: bid.status,
        auction_name: bid.auctions?.name || 'Leilão',
        client_notes: bid.client_notes,
        created_at: bid.created_at,
        updated_at: bid.updated_at,
      }));

      const formattedRegistrations = (registrationsData || []).map(reg => ({
        id: reg.id,
        type: 'registration' as const,
        status: reg.status,
        auction_name: reg.auctions?.name || 'Leilão',
        client_notes: reg.client_notes,
        created_at: reg.created_at,
        updated_at: reg.updated_at,
      }));

      const allNotifications = [...formattedBids, ...formattedRegistrations]
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 10); // Keep only last 10 notifications

      setNotifications(allNotifications);
      setUnreadCount(allNotifications.length);

    } catch (error) {
      console.error('❌ Error fetching global notifications:', error);
    }
  };

  const showToastForUpdate = (payload: any, type: 'registration' | 'bid') => {
    if (payload.new?.user_id !== user?.id) return;

    const newStatus = payload.new.status;
    const oldStatus = payload.old?.status;

    if (newStatus !== oldStatus && ['approved', 'rejected'].includes(newStatus)) {
      const typeText = type === 'bid' ? 'Lance' : 'Habilitação';
      
      if (newStatus === 'approved') {
        toast({
          title: `${typeText} Aprovado! ✅`,
          description: payload.new.client_notes || `Seu ${typeText.toLowerCase()} foi aprovado!`,
        });
      } else if (newStatus === 'rejected') {
        toast({
          title: `${typeText} Rejeitado ❌`,
          description: payload.new.client_notes || `Seu ${typeText.toLowerCase()} foi rejeitado.`,
          variant: "destructive"
        });
      }

      // Refresh notifications after showing toast
      setTimeout(() => {
        fetchNotifications();
      }, 500);
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    fetchNotifications();

    // Setup real-time subscriptions for both bids and registrations
    const channelName = `global-notifications-${user.id}-${Date.now()}`;
    
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'bids',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('🔔 Bid update received:', payload);
        showToastForUpdate(payload, 'bid');
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'auction_registrations',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('🔔 Registration update received:', payload);
        showToastForUpdate(payload, 'registration');
      })
      .subscribe((status) => {
        console.log('📡 Global notifications subscription status:', status);
      });

    return () => {
      console.log('🔌 Removing global notifications channel');
      supabase.removeChannel(channel);
    };
  }, [user?.id, toast]);

  const markAsRead = () => {
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    refetch: fetchNotifications
  };
};
