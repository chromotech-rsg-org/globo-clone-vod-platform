
import { useAuth } from '@/contexts/AuthContext';
import { useSimpleSubscriptionCheck } from '@/hooks/useSimpleSubscriptionCheck';

export const useAuctionAccess = () => {
  const { user } = useAuth();
  
  const isAdmin = user?.role === 'admin' || user?.role === 'desenvolvedor';
  
  const { hasActiveSubscription, loading } = useSimpleSubscriptionCheck(
    user?.id,
    !isAdmin
  );

  const canAccess = isAdmin || hasActiveSubscription;

  return {
    canAccess,
    hasActiveSubscription,
    isAdmin,
    loading,
    user
  };
};
