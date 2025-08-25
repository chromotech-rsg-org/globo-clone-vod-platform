
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSimpleSubscriptionCheck } from '@/hooks/useSimpleSubscriptionCheck';
import SubscriptionRequiredModal from '@/components/SubscriptionRequiredModal';

interface AuctionProtectedActionProps {
  children: React.ReactNode;
  onAction: () => void;
  className?: string;
}

const AuctionProtectedAction = ({ children, onAction, className }: AuctionProtectedActionProps) => {
  const { user } = useAuth();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'desenvolvedor';
  
  const { hasActiveSubscription, loading } = useSimpleSubscriptionCheck(
    user?.id,
    !isAdmin
  );

  const handleClick = () => {
    // Admin e developer sempre têm acesso
    if (isAdmin) {
      onAction();
      return;
    }

    // Usuários com assinatura ativa têm acesso
    if (hasActiveSubscription) {
      onAction();
      return;
    }

    // Usuários sem assinatura: mostrar modal
    setShowSubscriptionModal(true);
  };

  if (loading) {
    return (
      <div className={className}>
        <div className="animate-pulse bg-muted rounded h-10 w-full"></div>
      </div>
    );
  }

  return (
    <>
      <div onClick={handleClick} className={className}>
        {children}
      </div>
      
      <SubscriptionRequiredModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />
    </>
  );
};

export default AuctionProtectedAction;
