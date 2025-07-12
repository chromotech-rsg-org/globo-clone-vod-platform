import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/auth';

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  register: (userData: { email: string; password: string; name: string; cpf?: string; phone?: string }) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return {
        ...data,
        role: data.role || 'user'
      } as UserProfile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        return { error };
      }

      console.log('Login successful');
      return { error: null };
    } catch (error) {
      console.error('Login exception:', error);
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: { email: string; password: string; name: string; cpf?: string; phone?: string }) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: userData.name,
            cpf: userData.cpf || '',
            phone: userData.phone || ''
          }
        }
      });

      return { error };
    } catch (error) {
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing auth...');
        
        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        console.log('🔍 Initial session:', initialSession ? 'Found' : 'None');
        
        setSession(initialSession);
        
        if (initialSession?.user && !initialized) {
          console.log('👤 Fetching profile for user:', initialSession.user.id);
          const profile = await fetchProfile(initialSession.user.id);
          if (mounted) {
            setUser(profile);
            setInitialized(true);
          }
        } else if (!initialSession?.user) {
          setUser(null);
          setInitialized(true);
        }
        
        if (mounted) {
          setIsLoading(false);
          console.log('✅ Auth initialization complete');
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (mounted) {
          setIsLoading(false);
          setInitialized(true);
        }
      }
    };

    // Set up auth state listener (only for future changes)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('🔔 Auth state change:', event);
        
        if (!mounted || !initialized) return;

        setSession(newSession);
        
        if (newSession?.user) {
          console.log('👤 Auth change - fetching profile for:', newSession.user.id);
          const profile = await fetchProfile(newSession.user.id);
          if (mounted) {
            setUser(profile);
          }
        } else {
          if (mounted) {
            setUser(null);
          }
        }
      }
    );

    // Initialize once
    if (!initialized) {
      initializeAuth();
    }

    // Safety timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (mounted && isLoading) {
        console.log('⏰ Auth timeout - forcing loading to false');
        setIsLoading(false);
        setInitialized(true);
      }
    }, 10000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [initialized]);

  const value = {
    user,
    session,
    isLoading,
    login,
    logout,
    register,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};