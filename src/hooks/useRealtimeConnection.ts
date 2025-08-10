import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getRealtimeConfig, isProductionCustomDomain } from '@/utils/domainHealth';

export const useRealtimeConnection = () => {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'open' | 'closed' | 'error'>('connecting');
  const [retryAttempts, setRetryAttempts] = useState(0);

  useEffect(() => {
    const config = getRealtimeConfig();
    const isProdCustom = isProductionCustomDomain();
    
    console.log(`🔌 Setting up realtime connection with config:`, config);

    // Monitor connection status
    const handleConnectionChange = (status: string) => {
      console.log(`📡 Realtime connection status: ${status}`);
      setConnectionStatus(status as any);
      
      if (status === 'open') {
        setRetryAttempts(0);
      } else if (status === 'closed' && isProdCustom) {
        setRetryAttempts(prev => prev + 1);
      }
    };

    // Setup connection monitoring
    const channel = supabase
      .channel('connection-monitor')
      .subscribe((status) => {
        handleConnectionChange(status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { connectionStatus, retryAttempts };
};