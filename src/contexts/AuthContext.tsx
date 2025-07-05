
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthContextType, UserProfile } from '@/types/auth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuthOperations } from '@/hooks/useAuthOperations';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { fetchUserProfile } = useUserProfile();
  const { login, register, logout: performLogout } = useAuthOperations();

  // Memoize the profile fetching function to avoid infinite loops
  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      console.log('Loading profile for user:', userId);
      const profile = await fetchUserProfile(userId);
      console.log('Profile loaded:', profile);
      setUser(profile);
    } catch (error) {
      console.error('Error loading profile:', error);
      setUser(null);
    }
  }, [fetchUserProfile]);

  const handleLogout = async () => {
    setIsLoading(true);
    await performLogout();
    setUser(null);
    setSession(null);
    setIsLoading(false);
  };

  useEffect(() => {
    console.log('Setting up auth state listener');
    
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        
        if (session?.user) {
          // Defer profile loading to avoid infinite loops
          setTimeout(() => {
            loadUserProfile(session.user.id);
          }, 0);
        } else {
          console.log('No session, clearing user');
          setUser(null);
        }
        
        // Always set loading to false after handling auth state change
        setIsLoading(false);
      }
    );

    // Then check for initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
          setIsLoading(false);
          return;
        }

        console.log('Initial session:', session?.user?.id);
        setSession(session);
        
        if (session?.user) {
          await loadUserProfile(session.user.id);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        setIsLoading(false);
      }
    };

    getInitialSession();

    return () => subscription.unsubscribe();
  }, []); // Remove fetchUserProfile dependency to prevent infinite loops

  const value = {
    user,
    session,
    login,
    logout: handleLogout,
    register,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
