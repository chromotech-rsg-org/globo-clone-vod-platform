
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TermsAcceptanceData {
  subscriptionId?: string;
  termsVersion?: string;
}

export const useTermsAcceptance = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const acceptTerms = async (data: TermsAcceptanceData = {}) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    try {
      // Collect browser information
      const browserInfo = {
        ip_address: await fetch('https://api.ipify.org?format=json')
          .then(res => res.json())
          .then(data => data.ip)
          .catch(() => null),
        user_agent: navigator.userAgent,
        locale: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen_resolution: `${screen.width}x${screen.height}`,
        referrer: document.referrer || null,
      };

      const { error } = await supabase
        .from('terms_acceptances')
        .insert({
          user_id: user.id,
          subscription_id: data.subscriptionId || null,
          terms_version: data.termsVersion || '1.0',
          ...browserInfo,
          extra: {
            platform: navigator.platform,
            cookieEnabled: navigator.cookieEnabled,
            onlineStatus: navigator.onLine,
            timestamp: new Date().toISOString()
          }
        });

      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error accepting terms:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return { acceptTerms, loading };
};
