import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getRealtimeConfig, isProductionCustomDomain } from '@/utils/domainHealth';
import { createInstanceId } from '@/utils/realtime';

export const useRealtimeConnection = () => {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'open' | 'closed' | 'error'>('connecting');
  const [retryAttempts, setRetryAttempts] = useState(0);
  const instanceIdRef = useRef<string>('');

  useEffect(() => {
    // Create stable instance ID
    if (!instanceIdRef.current) {
      instanceIdRef.current = createInstanceId();
    }

    const config = getRealtimeConfig();
    const isProdCustom = isProductionCustomDomain();
    const channelName = `connection-monitor-${instanceIdRef.current}`;
    
    console.log(`🔌 [useRealtimeConnection] Setting up realtime connection with config:`, config);
    console.log(`📡 [useRealtimeConnection] Creating channel: ${channelName}`);

    // Monitor connection status
    const handleConnectionChange = (status: string) => {
      console.log(`📡 [useRealtimeConnection] Connection status: ${status}`);
      setConnectionStatus(status as any);
      
      if (status === 'open') {
        setRetryAttempts(0);
      } else if (status === 'closed' && isProdCustom) {
        setRetryAttempts(prev => prev + 1);
      }
    };

    // Setup connection monitoring
    const channel = supabase
      .channel(channelName)
      .subscribe((status) => {
        handleConnectionChange(status);
      });

    return () => {
      console.log(`📡 [useRealtimeConnection] Removing channel: ${channelName}`);
      supabase.removeChannel(channel);
    };
  }, []);

  return { connectionStatus, retryAttempts };
};