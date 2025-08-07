
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
    
    // Check if channel already exists and clean it up first
    const existingChannel = activeChannels.get(channelKey);
    if (existingChannel) {
      console.log('🧹 Cleaning up existing channel for', channelKey);
      activeChannels.delete(channelKey);
      supabase.removeChannel(existingChannel);
    }

    // Create unique channel with better naming
    const uniqueChannelName = `${channelKey}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`📡 Creating new channel: ${uniqueChannelName}`);
    
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
      });

    // Store channel in registry
    activeChannels.set(channelKey, channel);
    
    // Subscribe with error handling
    channel.subscribe((status) => {
      console.log(`📡 Channel subscription status for ${channelKey}:`, status);
      if (status === 'SUBSCRIBED') {
        console.log(`✅ Successfully subscribed to ${uniqueChannelName}`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`❌ Channel error for ${uniqueChannelName}`);
      } else if (status === 'TIMED_OUT') {
        console.error(`⏰ Channel timeout for ${uniqueChannelName}`);
      }
    });

    return () => {
      mounted.current = false;
      console.log(`🧹 Cleaning up channel: ${uniqueChannelName}`);
      
      // Remove from registry and unsubscribe
      const storedChannel = activeChannels.get(channelKey);
      if (storedChannel) {
        activeChannels.delete(channelKey);
        supabase.removeChannel(storedChannel);
      }
    };
  }, [page, fetchCustomizations]); // Remove channelKey from dependencies to prevent recreation

  const getCustomization = useCallback((section: string, key: string, defaultValue: any = '') => {
    const customKey = `${section}_${key}`;
    return customizations[customKey] || defaultValue;
  }, [customizations]);

  return { customizations, getCustomization, loading, refetch: fetchCustomizations };
};
