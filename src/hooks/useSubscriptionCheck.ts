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
      const { data, error } = await supabase
        .rpc('user_has_active_subscription', { user_uuid: user.id });

      if (error) throw error;
      setHasActiveSubscription(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setHasActiveSubscription(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSubscription();
  }, [user?.id]);

  return { 
    hasActiveSubscription, 
    loading, 
    refetch: checkSubscription 
  };
};