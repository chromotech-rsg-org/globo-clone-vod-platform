
import React, { useState, useEffect } from 'react';
// import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck';
import { useAuth } from '@/contexts/AuthContext';
import AuctionDashboard from './AuctionDashboard';
import SubscriptionRequiredModal from '@/components/SubscriptionRequiredModal';
import { useSimpleSubscriptionCheck } from '@/hooks/useSimpleSubscriptionCheck';

const AuctionHome = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'desenvolvedor';

  // Checa assinatura apenas para não-admin/dev.
  const { hasActiveSubscription, loading: subLoading } = useSimpleSubscriptionCheck(
    user?.id,
    !isAdmin
  );

  const loading = authLoading || (!isAdmin && subLoading);

  console.log('🎯 AuctionHome: Renderizando com dados:', {
    userEmail: user?.email,
    userRole: user?.role,
    hasActiveSubscription,
    loading
  });

  // Mantém hooks sempre no topo
  useEffect(() => {
    const shouldShowModal = !loading && !isAdmin && !hasActiveSubscription;
    if (shouldShowModal) {
      setShowSubscriptionModal(true);
    } else {
      setShowSubscriptionModal(false);
    }
  }, [loading, isAdmin, hasActiveSubscription]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // Admin e developer sempre têm acesso
  if (isAdmin) {
    console.log('✅ AuctionHome: Acesso administrativo concedido');
    return <AuctionDashboard />;
  }

  // Usuários com assinatura ativa têm acesso
  if (hasActiveSubscription) {
    console.log('✅ AuctionHome: Acesso por assinatura ativa');
    return <AuctionDashboard />;
  }

  // Usuários sem assinatura: mostrar modal
  console.log('❌ AuctionHome: Assinatura necessária');

  return (
    <>
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4">Verificando Acesso...</h1>
          <p className="text-muted-foreground">Aguarde um momento</p>
        </div>
      </div>
      
      <SubscriptionRequiredModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />
    </>
  );
};

export default AuctionHome;
