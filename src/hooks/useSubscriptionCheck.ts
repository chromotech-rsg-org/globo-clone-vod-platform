
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useSubscriptionCheck = () => {
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const checkSubscription = async () => {
    if (!user?.id) {
      setHasActiveSubscription(false);
      setLoading(false);
      return;
    }

    try {
      // First try using the RPC function
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('user_has_active_subscription', { user_uuid: user.id });

      if (!rpcError) {
        setHasActiveSubscription(rpcData);
        setLoading(false);
        return;
      }

      // Fallback: direct query to subscriptions table
      console.log('RPC failed, using fallback query:', rpcError);
      const { data: subscriptionData, error: queryError } = await supabase
        .from('subscriptions')
        .select('id, status, end_date')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (queryError) {
        if (queryError.code === 'PGRST116') {
          // No rows returned - no active subscription
          setHasActiveSubscription(false);
        } else {
          throw queryError;
        }
      } else {
        // Check if subscription is still valid
        const isValid = !subscriptionData.end_date || new Date(subscriptionData.end_date) > new Date();
        setHasActiveSubscription(isValid);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setHasActiveSubscription(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSubscription();

    // Set up real-time subscription for subscription changes
    if (user?.id) {
      const channel = supabase
        .channel(`subscription-changes-${user.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`
        }, () => {
          console.log('Subscription changed, rechecking...');
          checkSubscription();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id]);

  return { 
    hasActiveSubscription, 
    loading, 
    refetch: checkSubscription 
  };
};
