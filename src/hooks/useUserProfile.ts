
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/auth';

export const useUserProfile = () => {
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
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

  return { fetchUserProfile };
};
