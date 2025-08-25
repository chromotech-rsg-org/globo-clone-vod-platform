
import React, { useState } from 'react';
import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck';
import { useAuth } from '@/contexts/AuthContext';
import AuctionDashboard from './AuctionDashboard';
import SubscriptionRequiredModal from '@/components/SubscriptionRequiredModal';

const AuctionHome = () => {
  const { user } = useAuth();
  const { hasActiveSubscription, loading } = useSubscriptionCheck();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  console.log('🎯 AuctionHome: Renderizando com dados:', {
    userEmail: user?.email,
    userRole: user?.role,
    hasActiveSubscription,
    loading
  });

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
  if (user?.role === 'admin' || user?.role === 'desenvolvedor') {
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
  
  React.useEffect(() => {
    setShowSubscriptionModal(true);
  }, []);

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
