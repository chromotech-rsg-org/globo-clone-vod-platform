
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  cpf: string | null;
  phone: string | null;
  role: 'user' | 'admin' | 'desenvolvedor';
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<{ error: any }>;
  isLoading: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  cpf?: string;
  phone?: string;
  plan?: string;
}

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

  const fetchUserProfile = async (userId: string) => {
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

  useEffect(() => {
    console.log('Setting up auth state listener');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        
        if (session?.user) {
          // Use setTimeout to prevent blocking the auth state change
          setTimeout(async () => {
            const profile = await fetchUserProfile(session.user.id);
            console.log('Profile fetched:', profile);
            if (profile) {
              setUser(profile);
            }
            setIsLoading(false);
          }, 0);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.id);
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id).then(profile => {
          console.log('Initial profile fetch:', profile);
          if (profile) {
            setUser(profile);
          }
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    console.log('Attempting login for:', email);
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log('Login result:', error ? 'Error' : 'Success');
      if (error) {
        console.error('Login error:', error);
        setIsLoading(false);
      }
      
      return { error };
    } catch (error) {
      console.error('Login exception:', error);
      setIsLoading(false);
      return { error };
    }
  };

  const register = async (userData: RegisterData) => {
    setIsLoading(true);
    try {
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

      setIsLoading(false);
      return { error };
    } catch (error) {
      setIsLoading(false);
      return { error };
    }
  };

  const logout = async () => {
    console.log('Logging out');
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const value = {
    user,
    session,
    login,
    logout,
    register,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
