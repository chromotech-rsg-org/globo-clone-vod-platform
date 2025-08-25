
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/auth';
import { sanitizeInputSecure } from '@/utils/validators';
import { useAuth } from '@/contexts/AuthContext';

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      // Validate and sanitize userId
      if (!userId || typeof userId !== 'string') {
        console.error('Invalid user ID provided');
        return null;
      }

      // Basic UUID validation
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        console.error('Invalid UUID format for user ID');
        return null;
      }

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

      // Sanitize and validate profile data
      if (!data) return null;

      // Type-safe role conversion with validation
      const validRoles: ('user' | 'admin' | 'desenvolvedor')[] = ['user', 'admin', 'desenvolvedor'];
      const role = validRoles.includes(data.role as any) ? data.role as 'user' | 'admin' | 'desenvolvedor' : 'user';

      // Sanitize all text fields
      const sanitizedProfile: UserProfile = {
        id: data.id,
        email: sanitizeInputSecure(data.email || '', 254),
        name: sanitizeInputSecure(data.name || '', 100),
        cpf: data.cpf ? sanitizeInputSecure(data.cpf, 14) : null,
        phone: data.phone ? sanitizeInputSecure(data.phone, 15) : null,
        role,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      return sanitizedProfile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const updateProfile = async (updates: { name?: string; email?: string }) => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: updates.name ? sanitizeInputSecure(updates.name, 100) : undefined,
          email: updates.email ? sanitizeInputSecure(updates.email, 254) : undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }

      // Refresh the profile data
      const updatedProfile = await fetchUserProfile(user.id);
      setProfile(updatedProfile);
    } finally {
      setLoading(false);
    }
  };

  // Load profile on mount and when user changes
  useEffect(() => {
    const loadProfile = async () => {
      if (user?.id) {
        setLoading(true);
        const profileData = await fetchUserProfile(user.id);
        setProfile(profileData);
        setLoading(false);
      } else {
        setProfile(null);
        setLoading(false);
      }
    };

    loadProfile();
  }, [user?.id]);

  return { 
    profile, 
    loading, 
    fetchUserProfile, 
    updateProfile 
  };
};
