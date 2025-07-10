
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthContextType, UserProfile } from '@/types/auth';
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
  const [isInitialized, setIsInitialized] = useState(false);

  const { login, register, logout: performLogout } = useAuthOperations();

  // Direct profile fetching function without hooks to avoid dependencies
  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      console.log('Profile data received:', data);

      // Type-safe role conversion
      const validRoles: ('user' | 'admin' | 'desenvolvedor')[] = ['user', 'admin', 'desenvolvedor'];
      const role = validRoles.includes(data.role as any) ? data.role as 'user' | 'admin' | 'desenvolvedor' : 'user';

      return {
        ...data,
        role
      } as UserProfile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const handleLogout = async () => {
    try {
      console.log('Logging out...');
      setIsLoading(true);
      await performLogout();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    console.log('Setting up auth state listener');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event, session?.user?.id || 'no user');
        
        try {
          setSession(session);
          
          if (session?.user?.id) {
            console.log('User authenticated, loading profile...');
            const profile = await fetchProfile(session.user.id);
            if (mounted) {
              setUser(profile);
            }
          } else {
            console.log('No session, clearing user');
            if (mounted) {
              setUser(null);
            }
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          if (mounted) {
            setUser(null);
          }
        } finally {
          if (mounted) {
            setIsLoading(false);
            setIsInitialized(true);
          }
        }
      }
    );

    // Check for initial session
    const initializeAuth = async () => {
      if (!mounted) return;
      
      try {
        console.log('Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
          return;
        }

        console.log('Initial session:', session?.user?.id || 'no session');
        
        if (mounted) {
          setSession(session);
          
          if (session?.user?.id) {
            const profile = await fetchProfile(session.user.id);
            if (mounted) {
              setUser(profile);
            }
          }
        }
      } catch (error) {
        console.error('Error in initializeAuth:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array - no dependencies needed

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
