import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/auth';
import { performDomainHealthCheck, logDomainInfo, isCustomDomain } from '@/utils/domainHealth';

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

  // Debug info for domain-specific issues
  useEffect(() => {
    logDomainInfo();
    
    // Perform comprehensive health check
    performDomainHealthCheck().then(healthCheck => {
      console.log(`🏥 Domain health check results:`, healthCheck);
      
      if (healthCheck.errors.length > 0) {
        console.warn(`⚠️ Health check found issues:`, healthCheck.errors);
      }
      
      if (isCustomDomain() && !healthCheck.supabaseConnectivity) {
        console.error(`🚨 Custom domain ${healthCheck.domain} has connectivity issues!`);
      }
    });
  }, []);

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
    let timeoutId: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        const currentDomain = window.location.hostname;
        console.log(`🔄 Initializing auth on ${currentDomain}...`);
        setIsLoading(true);
        
        // Add retry logic for custom domains
        let retries = currentDomain.includes('agromercado.tv.br') ? 3 : 1;
        let lastError = null;
        
        while (retries > 0) {
          try {
            // Get initial session
            const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) {
              lastError = sessionError;
              console.warn(`⚠️ Session error on ${currentDomain} (${retries} retries left):`, sessionError);
              retries--;
              if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
              }
              throw sessionError;
            }
            
            if (!mounted) return;
            
            console.log(`✅ Session retrieved on ${currentDomain}:`, initialSession ? 'authenticated' : 'not authenticated');
            setSession(initialSession);
            
            if (initialSession?.user) {
              const profile = await fetchProfile(initialSession.user.id);
              if (mounted) {
                setUser(profile);
                console.log(`✅ User profile loaded on ${currentDomain}:`, profile?.email);
              }
            } else {
              setUser(null);
            }
            
            if (mounted) {
              setIsLoading(false);
              setInitialized(true);
            }
            
            break; // Success, exit retry loop
            
          } catch (error) {
            lastError = error;
            retries--;
            if (retries > 0) {
              console.log(`🔄 Retrying auth initialization on ${currentDomain}... (${retries} left)`);
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
        
        if (retries === 0 && lastError) {
          throw lastError;
        }
        
      } catch (error) {
        const currentDomain = window.location.hostname;
        console.error(`❌ Auth initialization failed on ${currentDomain}:`, error);
        if (mounted) {
          setIsLoading(false);
          setInitialized(true);
          setUser(null);
          setSession(null);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!mounted) return;

        setSession(newSession);
        
        if (newSession?.user) {
          // Use setTimeout to prevent blocking the auth state change
          setTimeout(() => {
            if (mounted) {
              fetchProfile(newSession.user.id).then(profile => {
                if (mounted) {
                  setUser(profile);
                }
              });
            }
          }, 0);
        } else {
          setUser(null);
        }
      }
    );

    // Initialize only once
    if (!initialized) {
      initializeAuth();
      
      // Fallback timeout
      timeoutId = setTimeout(() => {
        if (mounted && isLoading) {
          setIsLoading(false);
          setInitialized(true);
        }
      }, 5000);
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

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