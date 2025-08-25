
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuctionDashboard from './AuctionDashboard';

const AuctionHome = () => {
  const { user, isLoading: authLoading } = useAuth();

  console.log('🎯 AuctionHome: Renderizando com dados:', {
    userEmail: user?.email,
    userRole: user?.role,
    loading: authLoading
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Todos os usuários autenticados podem ver o dashboard
  // As restrições serão aplicadas em funcionalidades específicas
  console.log('✅ AuctionHome: Exibindo dashboard');
  return <AuctionDashboard />;
};

export default AuctionHome;
