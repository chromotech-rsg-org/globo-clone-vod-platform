
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Customization {
  id: string;
  page: string;
  section: string;
  element_type: string;
  element_key: string;
  element_value: string | null;
  active: boolean;
}

// Global registry to track active channels
const activeChannels = new Map<string, any>();

export const useCustomizations = (page: string) => {
  const [customizations, setCustomizations] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const channelKey = `customizations-${page}`;
  const mounted = useRef(true);

  const fetchCustomizations = useCallback(async () => {
    if (!mounted.current) return;
    
    try {
      const { data, error } = await supabase
        .from('customizations')
        .select('*')
        .eq('page', page)
        .eq('active', true);

      if (error) throw error;

      const customizationsMap: Record<string, any> = {};
      data?.forEach((item: Customization) => {
        const key = `${item.section}_${item.element_key}`;
        customizationsMap[key] = item.element_value;
      });

      if (mounted.current) {
        setCustomizations(customizationsMap);
      }
    } catch (error) {
      console.error('Erro ao buscar personalizações:', error);
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, [page]);

  useEffect(() => {
    mounted.current = true;
    fetchCustomizations();
    
    let retryCount = 0;
    const maxRetries = 3;
    let cleanupFn: (() => void) | null = null;
    
    const setupSubscription = () => {
      try {
        const uniqueChannelName = `${channelKey}-${Math.random().toString(36).substr(2, 9)}`;
        
        const channel = supabase
          .channel(uniqueChannelName)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'customizations',
            filter: `page=eq.${page}`
          }, (payload) => {
            console.log(`🔔 Customization change detected for ${page}:`, payload);
            if (mounted.current) {
              fetchCustomizations();
            }
          })
          .subscribe((status) => {
            console.log(`📡 Subscription status for ${page}:`, status);
            
            // Retry logic for failed subscriptions on custom domains
            if (status === 'CHANNEL_ERROR' && retryCount < maxRetries && window.location.hostname.includes('agromercado.tv.br')) {
              retryCount++;
              console.log(`🔄 Retrying subscription for ${page} (attempt ${retryCount}/${maxRetries})`);
              setTimeout(setupSubscription, 2000 * retryCount);
            }
          });

        cleanupFn = () => {
          mounted.current = false;
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.error(`❌ Failed to setup subscription for ${page}:`, error);
        
        // Fallback to polling for custom domains
        if (window.location.hostname.includes('agromercado.tv.br')) {
          console.log(`🔄 Falling back to polling for ${page}`);
          const pollInterval = setInterval(() => {
            if (mounted.current) {
              fetchCustomizations();
            }
          }, 5000);
          
          cleanupFn = () => {
            clearInterval(pollInterval);
          };
        }
      }
    };

    setupSubscription();
    
    return () => {
      cleanupFn?.();
    };
  }, [page, fetchCustomizations]);

  const getCustomization = useCallback((section: string, key: string, defaultValue: any = '') => {
    const customKey = `${section}_${key}`;
    return customizations[customKey] || defaultValue;
  }, [customizations]);

  return { customizations, getCustomization, loading, refetch: fetchCustomizations };
};
