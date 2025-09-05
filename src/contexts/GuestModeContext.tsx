import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface GuestModeContextType {
  isGuestMode: boolean;
  setGuestMode: (enabled: boolean) => void;
  showAuthPrompt: () => void;
}

const GuestModeContext = createContext<GuestModeContextType | undefined>(undefined);

export const useGuestMode = () => {
  const context = useContext(GuestModeContext);
  if (!context) {
    throw new Error('useGuestMode must be used within a GuestModeProvider');
  }
  return context;
};

export const GuestModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const { user } = useAuth();

  // Clear guest mode when user logs in
  useEffect(() => {
    if (user) {
      setIsGuestMode(false);
    }
  }, [user]);

  const setGuestMode = (enabled: boolean) => {
    setIsGuestMode(enabled);
  };

  const showAuthPrompt = () => {
    setShowAuthDialog(true);
  };

  const value = {
    isGuestMode,
    setGuestMode,
    showAuthPrompt
  };

  return (
    <GuestModeContext.Provider value={value}>
      {children}
    </GuestModeContext.Provider>
  );
};