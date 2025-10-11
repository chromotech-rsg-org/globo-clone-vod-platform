import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { createInstanceId } from '@/utils/realtime';

export const useSubscriptionCheck = () => {
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const instanceIdRef = useRef<string>('');

  const checkSubscription = async () => {
    if (!user?.id) {
      console.log('🔒 useSubscriptionCheck: No user found');
      setHasActiveSubscription(false);
      setLoading(false);
      return;
    }

    console.log('🔍 useSubscriptionCheck: Checking subscription for user:', user.email, 'Role:', user.role);

    // Admin and developer bypass - they always have access
    if (user.role === 'admin' || user.role === 'desenvolvedor') {
      console.log('✅ useSubscriptionCheck: Admin/Developer bypass - access granted');
      setHasActiveSubscription(true);
      setLoading(false);
      return;
    }

    try {
      // First try using the RPC function with better error handling
      console.log('🔄 useSubscriptionCheck: Trying RPC function...');
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('user_has_active_subscription', { user_uuid: user.id });

      if (!rpcError && rpcData !== null) {
        console.log('✅ useSubscriptionCheck: RPC success, result:', rpcData);
        setHasActiveSubscription(rpcData);
        setLoading(false);
        return;
      }

      // Enhanced fallback: direct query to subscriptions table
      console.log('⚠️ useSubscriptionCheck: RPC failed, using fallback query. Error:', rpcError?.message);
      const { data: subscriptionData, error: queryError } = await supabase
        .from('subscriptions')
        .select('id, status, end_date, start_date')
        .eq('user_id', user.id)
        .in('status', ['active', 'trial']) // Include trial status
        .order('created_at', { ascending: false });

      if (queryError) {
        console.error('❌ useSubscriptionCheck: Query error:', queryError);
        setHasActiveSubscription(false);
      } else {
        console.log('📋 useSubscriptionCheck: Found subscriptions:', subscriptionData?.length || 0);
        
        if (!subscriptionData || subscriptionData.length === 0) {
          console.log('❌ useSubscriptionCheck: No active subscriptions found');
          setHasActiveSubscription(false);
        } else {
          // Check if any subscription is valid
          const now = new Date();
          const validSubscription = subscriptionData.find(sub => {
            // Check if subscription is active/trial
            if (!['active', 'trial'].includes(sub.status)) {
              console.log(`❌ Subscription ${sub.id}: Invalid status ${sub.status}`);
              return false;
            }
            
            // Check end date (null means no expiration)
            if (sub.end_date) {
              const endDate = new Date(sub.end_date);
              const isExpired = endDate <= now;
              console.log(`📅 Subscription ${sub.id}: End date ${sub.end_date}, expired: ${isExpired}`);
              return !isExpired;
            }
            
            console.log(`✅ Subscription ${sub.id}: Valid (no end date)`);
            return true;
          });

          if (validSubscription) {
            console.log('✅ useSubscriptionCheck: Valid subscription found:', validSubscription.id);
            setHasActiveSubscription(true);
          } else {
            console.log('❌ useSubscriptionCheck: No valid subscriptions found');
            setHasActiveSubscription(false);
          }
        }
      }
    } catch (error) {
      console.error('💥 useSubscriptionCheck: Unexpected error:', error);
      setHasActiveSubscription(false);
    } finally {
      setLoading(false);
      console.log('🏁 useSubscriptionCheck: Check completed');
    }
  };

  useEffect(() => {
    checkSubscription();

    // Set up real-time subscription for subscription changes
    if (user?.id) {
      // Create stable instance ID
      if (!instanceIdRef.current) {
        instanceIdRef.current = createInstanceId();
      }

      const channelName = `subscription-changes-${user.id}-${instanceIdRef.current}`;
      console.log('📡 [useSubscriptionCheck] Setting up real-time subscription monitoring');
      console.log(`📡 [useSubscriptionCheck] Creating channel: ${channelName}`);
      
      const channel = supabase
        .channel(channelName)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          console.log('🔔 [useSubscriptionCheck] Subscription change detected:', payload);
          // Small delay to ensure database consistency
          setTimeout(() => {
            checkSubscription();
          }, 500);
        })
        .subscribe((status) => {
          console.log('📡 [useSubscriptionCheck] Realtime subscription status:', status);
        });

      return () => {
        console.log(`📡 [useSubscriptionCheck] Removing channel: ${channelName}`);
        supabase.removeChannel(channel);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return { 
    hasActiveSubscription, 
    loading, 
    refetch: checkSubscription 
  };
};
