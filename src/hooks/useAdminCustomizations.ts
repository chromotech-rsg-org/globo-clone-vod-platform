import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminCustomization {
  id?: string;
  element_key: string;
  element_value: string;
  element_type: 'text' | 'color' | 'image';
  label: string;
  section: string;
}

export const useAdminCustomizations = () => {
  const [customizations, setCustomizations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const systemDefaults: Record<string, string> = {
    // Sistema - Configurações gerais
    'admin_logo': '',
    'admin_title': 'Painel Administrativo',
    'admin_company_name': 'Minha Empresa',
    
    // Cores do Sistema Admin
    'admin_primary_color': '#3b82f6',
    'admin_button_bg_color': '#3b82f6',
    'admin_button_text_color': '#ffffff',
    'admin_button_hover_color': '#2563eb',
    'admin_sidebar_bg': '#1f2937',
    'admin_sidebar_text_color': '#f3f4f6',
    'admin_content_bg': '#111827',
    'admin_dashboard_text_color': '#f3f4f6',
    'admin_table_header_bg': '#374151',
    'admin_table_bg_color': '#1f2937',
    'admin_table_text_color': '#f3f4f6',
    'admin_success_color': '#10b981',
    'admin_danger_color': '#ef4444',
    'admin_warning_color': '#f59e0b'
  };

  useEffect(() => {
    fetchCustomizations();
    
    // Listen for updates
    const channel = supabase
      .channel('admin-customizations')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'customizations',
        filter: 'page=eq.admin'
      }, () => {
        fetchCustomizations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCustomizations = async () => {
    try {
      const { data, error } = await supabase
        .from('customizations')
        .select('*')
        .eq('page', 'admin')
        .eq('active', true);

      if (error) throw error;

      const customizationMap: Record<string, string> = { ...systemDefaults };
      
      data?.forEach(item => {
        if (item.element_value) {
          customizationMap[item.element_key] = item.element_value;
        }
      });

      setCustomizations(customizationMap);
      
      // Apply customizations immediately
      applyCustomizationsToSystem(customizationMap);
    } catch (error) {
      console.error('Erro ao buscar personalizações:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCustomization = async (key: string, value: string, section: string, elementType: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      // Verificar se já existe
      const { data: existing, error: selectError } = await supabase
        .from('customizations')
        .select('id')
        .eq('page', 'admin')
        .eq('section', section)
        .eq('element_key', key)
        .maybeSingle();

      if (selectError) throw selectError;

      if (existing?.id) {
        // Atualizar existente
        const { error: updateError } = await supabase
          .from('customizations')
          .update({
            element_value: value,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (updateError) throw updateError;
      } else {
        // Criar novo
        const { error: insertError } = await supabase
          .from('customizations')
          .insert({
            page: 'admin',
            section: section,
            element_type: elementType,
            element_key: key,
            element_value: value,
            active: true
          });

        if (insertError) throw insertError;
      }

      // Update local state
      setCustomizations(prev => ({ ...prev, [key]: value }));
      
      // Apply immediately
      applyCustomizationsToSystem({ ...customizations, [key]: value });
      
      // Notify other components
      window.dispatchEvent(new CustomEvent('adminCustomizationUpdated', { 
        detail: { key, value } 
      }));

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao salvar personalização:', error);
      return { success: false, error: error.message };
    }
  };

  const applyCustomizationsToSystem = (customizationMap: Record<string, string>) => {
    const root = document.documentElement;

    Object.entries(customizationMap).forEach(([key, value]) => {
      if (key.includes('color') && value) {
        const hslColor = hexToHsl(value);
        
        switch (key) {
          case 'admin_primary_color':
            root.style.setProperty('--admin-primary', hslColor);
            root.style.setProperty('--primary', hslColor);
            break;
          case 'admin_button_bg_color':
            root.style.setProperty('--admin-button-bg', hslColor);
            break;
          case 'admin_button_text_color':
            root.style.setProperty('--admin-button-text', hslColor);
            break;
          case 'admin_button_hover_color':
            root.style.setProperty('--admin-button-hover', hslColor);
            break;
          case 'admin_success_color':
            root.style.setProperty('--admin-success', hslColor);
            break;
          case 'admin_danger_color':
            root.style.setProperty('--admin-danger', hslColor);
            root.style.setProperty('--destructive', hslColor);
            break;
          case 'admin_warning_color':
            root.style.setProperty('--admin-warning', hslColor);
            break;
          case 'admin_sidebar_bg':
            root.style.setProperty('--admin-sidebar-bg', hslColor);
            break;
          case 'admin_sidebar_text_color':
            root.style.setProperty('--admin-sidebar-text', hslColor);
            break;
          case 'admin_content_bg':
            root.style.setProperty('--admin-content-bg', hslColor);
            break;
          case 'admin_dashboard_text_color':
            root.style.setProperty('--admin-dashboard-text', hslColor);
            break;
          case 'admin_table_header_bg':
            root.style.setProperty('--admin-table-header', hslColor);
            break;
          case 'admin_table_bg_color':
            root.style.setProperty('--admin-table-bg', hslColor);
            break;
          case 'admin_table_text_color':
            root.style.setProperty('--admin-table-text', hslColor);
            break;
        }
      } else if (key === 'admin_title' && value) {
        document.title = value;
      }
    });
  };

  const hexToHsl = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  const getCustomization = (key: string, defaultValue: string = '') => {
    return customizations[key] || systemDefaults[key] || defaultValue;
  };

  return { 
    customizations, 
    getCustomization, 
    saveCustomization, 
    loading, 
    refetch: fetchCustomizations 
  };
};