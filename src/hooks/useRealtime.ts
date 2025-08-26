
import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UseRealtimeProps {
  onBidUpdate?: () => void;
  onRegistrationUpdate?: () => void;
  onSubscriptionUpdate?: () => void;
  auctionId?: string;
}

export const useRealtime = ({
  onBidUpdate,
  onRegistrationUpdate,
  onSubscriptionUpdate,
  auctionId
}: UseRealtimeProps) => {
  const { user } = useAuth();

  const setupRealtimeSubscriptions = useCallback(() => {
    if (!user?.id) return;

    const channels: any[] = [];

    // Bids realtime
    if (onBidUpdate && auctionId) {
      const bidsChannel = supabase
        .channel(`bids-${auctionId}-${user.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'bids',
          filter: `auction_id=eq.${auctionId}`
        }, () => {
          console.log('🔔 Bid update detected');
          onBidUpdate();
        })
        .subscribe();
      
      channels.push(bidsChannel);
    }

    // Registrations realtime
    if (onRegistrationUpdate) {
      const registrationsChannel = supabase
        .channel(`registrations-${user.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'auction_registrations',
          filter: `user_id=eq.${user.id}`
        }, () => {
          console.log('🔔 Registration update detected');
          onRegistrationUpdate();
        })
        .subscribe();
      
      channels.push(registrationsChannel);
    }

    // Subscriptions realtime
    if (onSubscriptionUpdate) {
      const subscriptionsChannel = supabase
        .channel(`subscriptions-${user.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`
        }, () => {
          console.log('🔔 Subscription update detected');
          onSubscriptionUpdate();
        })
        .subscribe();
      
      channels.push(subscriptionsChannel);
    }

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [user?.id, onBidUpdate, onRegistrationUpdate, onSubscriptionUpdate, auctionId]);

  useEffect(() => {
    const cleanup = setupRealtimeSubscriptions();
    return cleanup;
  }, [setupRealtimeSubscriptions]);
};
