
import { supabase } from '@/integrations/supabase/client';
import { RegisterData } from '@/types/auth';

export const useAuthOperations = () => {
  const login = async (email: string, password: string) => {
    console.log('Attempting login for:', email);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log('Login result:', error ? 'Error' : 'Success', data?.user?.id);
      
      if (error) {
        console.error('Login error:', error);
        return { error };
      }

      // Profile will be fetched by the auth state change listener
      console.log('Login successful, profile will be loaded by listener');
      return { error: null };
    } catch (error) {
      console.error('Login exception:', error);
      return { error };
    }
  };

  const register = async (userData: RegisterData) => {
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

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const logout = async () => {
    console.log('Logging out');
    await supabase.auth.signOut();
  };

  return { login, register, logout };
};
