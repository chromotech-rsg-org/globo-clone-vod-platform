
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Customization {
  id: string;
  page: string;
  section: string;
  element_type: string;
  element_key: string;
  element_value: string | null;
  active: boolean;
}

export const useCustomizations = (page: string) => {
  const [customizations, setCustomizations] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    fetchCustomizations();
    
    // Clean up any existing subscription
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    
    // Create new subscription only if none exists
    if (!channelRef.current) {
      const channelId = `customizations-${page}-${Math.random().toString(36).substr(2, 9)}`;
      channelRef.current = supabase
        .channel(channelId)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'customizations',
          filter: `page=eq.${page}`
        }, () => {
          fetchCustomizations();
        })
        .subscribe();
    }

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [page]);

  const fetchCustomizations = async () => {
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

      setCustomizations(customizationsMap);
    } catch (error) {
      console.error('Erro ao buscar personalizações:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCustomization = (section: string, key: string, defaultValue: any = '') => {
    const customKey = `${section}_${key}`;
    return customizations[customKey] || defaultValue;
  };

  return { customizations, getCustomization, loading, refetch: fetchCustomizations };
};
