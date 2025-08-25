
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
      console.log('🔍 Checking subscription for user:', user.id);
      
      const { data, error } = await supabase
        .rpc('user_has_active_subscription', { user_uuid: user.id });

      if (error) {
        console.error('❌ Subscription check error:', error);
        throw error;
      }
      
      console.log('✅ Subscription check result:', data);
      setHasActiveSubscription(data);
    } catch (error) {
      console.error('💥 Error checking subscription:', error);
      setHasActiveSubscription(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSubscription();
    
    // Set up real-time subscription to monitor subscription changes
    if (user?.id) {
      const subscription = supabase
        .channel(`user-subscriptions-${user.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          console.log('🔄 Subscription changed:', payload);
          checkSubscription();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [user?.id]);

  return { 
    hasActiveSubscription, 
    loading, 
    refetch: checkSubscription 
  };
};
