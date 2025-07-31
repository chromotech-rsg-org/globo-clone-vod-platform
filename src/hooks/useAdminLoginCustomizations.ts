
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCustomizations } from '@/hooks/useCustomizations';

export const useAdminLoginCustomizations = () => {
  const { customizations, refetch } = useCustomizations('login');
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const getCustomization = (key: string, defaultValue: string = '') => {
    // Try different prefixes to find the value
    const possibleKeys = [
      `branding_${key}`,
      `form_${key}`,
      `background_${key}`,
      `theme_${key}`,
      key
    ];
    
    for (const possibleKey of possibleKeys) {
      if (customizations[possibleKey] !== undefined) {
        return customizations[possibleKey];
      }
    }
    
    return defaultValue;
  };

  const saveCustomization = async (key: string, value: string, section: string, elementType: string) => {
    setSaving(prev => ({ ...prev, [key]: true }));
    
    try {
      const { error } = await supabase
        .from('customizations')
        .upsert({
          page: 'login',
          section: section,
          element_type: elementType,
          element_key: key,
          element_value: value,
          active: true
        }, {
          onConflict: 'page,section,element_key'
        });

      if (error) throw error;
      
      await refetch();
      return { success: true };
    } catch (error) {
      console.error('Erro ao salvar:', error);
      return { success: false, error: 'Erro ao salvar personalização' };
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  return {
    customizations,
    getCustomization,
    saveCustomization,
    loading: Object.keys(customizations).length === 0,
    saving
  };
};
