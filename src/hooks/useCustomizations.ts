
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isProductionCustomDomain, clearVercelCache } from '@/utils/vercelOptimizations';

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
  const isProdCustom = isProductionCustomDomain();

  const fetchCustomizations = useCallback(async () => {
    if (!mounted.current) return;
    
    try {
      // Clear Vercel cache for production domain
      if (isProdCustom) {
        clearVercelCache();
      }

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
        console.log(`✅ Customizations loaded for ${page}:`, Object.keys(customizationsMap).length, 'items');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar personalizações:', error);
      
      // Fallback strategy for production domain
      if (isProdCustom && mounted.current) {
        console.log('🔄 Retrying customizations fetch for production domain...');
        setTimeout(() => {
          if (mounted.current) {
            fetchCustomizations();
          }
        }, 2000);
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, [page, isProdCustom]);

  useEffect(() => {
    mounted.current = true;
    fetchCustomizations();
    
    let retryCount = 0;
    const maxRetries = isProdCustom ? 5 : 3;
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
              // Clear cache before refetching
              if (isProdCustom) {
                clearVercelCache();
              }
              fetchCustomizations();
            }
          })
          .subscribe((status) => {
            console.log(`📡 Subscription status for ${page}:`, status);
            
            // Enhanced retry logic for production domain
            if (status === 'CHANNEL_ERROR' && retryCount < maxRetries && isProdCustom) {
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
        
        // Enhanced fallback to polling for production domain
        if (isProdCustom) {
          console.log(`🔄 Falling back to polling for ${page} on production domain`);
          const pollInterval = setInterval(() => {
            if (mounted.current) {
              fetchCustomizations();
            }
          }, 10000); // Poll every 10 seconds for production
          
          cleanupFn = () => {
            clearInterval(pollInterval);
            mounted.current = false;
          };
        }
      }
    };

    setupSubscription();
    
    return () => {
      cleanupFn?.();
    };
  }, [page, fetchCustomizations, isProdCustom]);

  const getCustomization = useCallback((section: string, key: string, defaultValue: any = '') => {
    const customKey = `${section}_${key}`;
    const value = customizations[customKey] || defaultValue;
    
    if (isProdCustom && !customizations[customKey] && defaultValue !== value) {
      console.log(`🔍 Customization not found for ${customKey}, using default:`, defaultValue);
    }
    
    return value;
  }, [customizations, isProdCustom]);

  return { customizations, getCustomization, loading, refetch: fetchCustomizations };
};
