
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Plan {
  id: string;
  name: string;
  price: number;
  billing_cycle: string;
  description?: string;
  benefits?: string[];
}

interface UserSubscription {
  id: string;
  plan: Plan;
  status: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
}

export const usePlanManagement = () => {
  const { user } = useAuth();
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserSubscription = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          id,
          status,
          start_date,
          end_date,
          created_at,
          plans (
            id,
            name,
            price,
            billing_cycle,
            description,
            benefits
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setCurrentSubscription({
          id: data.id,
          plan: data.plans as Plan,
          status: data.status,
          start_date: data.start_date,
          end_date: data.end_date,
          created_at: data.created_at
        });
      } else {
        setCurrentSubscription(null);
      }
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      setCurrentSubscription(null);
    }
  };

  const fetchAvailablePlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('active', true)
        .order('priority', { ascending: true });

      if (error) throw error;
      setAvailablePlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      setAvailablePlans([]);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchUserSubscription(),
        fetchAvailablePlans()
      ]);
      setLoading(false);
    };

    fetchData();

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
          fetchUserSubscription();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id]);

  const canUpgrade = (targetPlan: Plan): boolean => {
    if (!currentSubscription) return true;
    return targetPlan.price > currentSubscription.plan.price;
  };

  const canDowngrade = (targetPlan: Plan): boolean => {
    if (!currentSubscription) return false;
    return targetPlan.price < currentSubscription.plan.price;
  };

  return {
    currentSubscription,
    availablePlans,
    loading,
    canUpgrade,
    canDowngrade,
    refetch: () => {
      fetchUserSubscription();
      fetchAvailablePlans();
    }
  };
};
