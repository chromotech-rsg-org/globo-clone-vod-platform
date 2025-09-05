import React, { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, User, X } from 'lucide-react';
import AuthRequiredModal from '@/components/auth/AuthRequiredModal';

interface GuestModeBannerProps {
  className?: string;
}

const GuestModeBanner = ({ className }: GuestModeBannerProps) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <>
      <Alert className={`bg-amber-50 border-amber-200 ${className}`}>
        <Info className="h-4 w-4 text-amber-600" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex-1">
            <span className="text-amber-800">
              Você está visualizando como <strong>visitante</strong>. 
              Para participar dos leilões e dar lances, faça login em sua conta.
            </span>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Button 
              size="sm" 
              onClick={() => setShowAuthModal(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <User className="h-3 w-3 mr-1" />
              Fazer Login
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsVisible(false)}
              className="text-amber-600 hover:text-amber-700 hover:bg-amber-100"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onContinueAsGuest={() => setShowAuthModal(false)}
        title="Entrar na sua conta"
        message="Faça login para participar dos leilões e dar lances nos itens."
      />
    </>
  );
};

export default GuestModeBanner;