import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthRequiredModal from '@/components/auth/AuthRequiredModal';
import { GuestModeProvider } from '@/contexts/GuestModeContext';

interface AuctionProtectedRouteProps {
  children: React.ReactNode;
  allowGuest?: boolean;
}

const AuctionProtectedRoute = ({ children, allowGuest = true }: AuctionProtectedRouteProps) => {
  const { user, isLoading, session } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Store the intended destination in sessionStorage for redirect after auth
    if (!user && !isLoading) {
      sessionStorage.setItem('auction_redirect_url', location.pathname + location.search);
      if (!isGuestMode) {
        setShowAuthModal(true);
      }
    } else if (user && session) {
      // User is authenticated, check if they came from a stored redirect
      const redirectUrl = sessionStorage.getItem('auction_redirect_url');
      if (redirectUrl && redirectUrl !== location.pathname) {
        sessionStorage.removeItem('auction_redirect_url');
        navigate(redirectUrl, { replace: true });
      }
    }
  }, [user, isLoading, location, navigate, isGuestMode, session]);

  // Clear guest mode when user authenticates
  useEffect(() => {
    if (user) {
      setIsGuestMode(false);
      setShowAuthModal(false);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-white">Carregando...</p>
        </div>
      </div>
    );
  }

  const handleContinueAsGuest = () => {
    setIsGuestMode(true);
    setShowAuthModal(false);
    sessionStorage.removeItem('auction_redirect_url');
  };

  const handleCloseAuthModal = () => {
    // If user closes modal without authenticating and guest mode is not allowed,
    // redirect to home page
    if (!allowGuest) {
      navigate('/', { replace: true });
    } else {
      setShowAuthModal(false);
    }
  };

  // If user is authenticated or in guest mode, show the content
  if (user || isGuestMode) {
    return (
      <GuestModeProvider>
        <div className="auction-protected-content">
          {children}
          {/* Show auth modal even in guest mode for easy access to login */}
          <AuthRequiredModal
            isOpen={showAuthModal}
            onClose={handleCloseAuthModal}
            onContinueAsGuest={handleContinueAsGuest}
            title="Acesso aos Leilões"
            message="Para participar dos leilões e dar lances, você precisa estar logado. Você pode continuar como visitante para apenas visualizar."
          />
        </div>
      </GuestModeProvider>
    );
  }

  // Show auth modal for unauthenticated users
  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <h2 className="text-xl mb-4">Carregando página de leilões...</h2>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
      
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={handleCloseAuthModal}
        onContinueAsGuest={handleContinueAsGuest}
        title="Acesso aos Leilões"
        message="Para participar dos leilões e dar lances, você precisa estar logado. Você pode continuar como visitante para apenas visualizar."
      />
    </>
  );
};

export default AuctionProtectedRoute;