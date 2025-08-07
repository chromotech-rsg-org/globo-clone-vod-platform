import { useEffect, useCallback, useRef } from 'react';
import { useCustomizations } from './useCustomizations';
import { hexToHsl } from '@/utils/colorUtils';

export const useAdminCustomizations = () => {
  const { customizations, refetch } = useCustomizations('home');
  const isInitialized = useRef(false);

  const getCustomization = useCallback((key: string, defaultValue: string = '') => {
    const fullKey = `global_${key}`;
    return customizations[fullKey] || defaultValue;
  }, [customizations]);

  const applyAdminStyles = useCallback(() => {
    const root = document.documentElement;
    
    // Aplicar cores customizadas do admin
    const adminContentBg = getCustomization('admin_content_bg_color', '#111827');
    const adminSidebarBg = getCustomization('admin_sidebar_bg_color', '#374151');
    const adminSidebarText = getCustomization('admin_sidebar_text_color', '#ffffff');
    const adminPrimary = getCustomization('admin_primary_color', '#3b82f6');
    const adminTableBg = getCustomization('admin_table_bg_color', '#374151');
    const adminCardBg = getCustomization('admin_card_bg_color', '#374151');
    const siteName = getCustomization('global_site_name', 'Painel Administrativo');
    const faviconImage = getCustomization('favicon_image', '');

    // Converter cores hex para HSL e aplicar
    try {
      if (adminContentBg !== '#111827') {
        const hsl = hexToHsl(adminContentBg);
        root.style.setProperty('--admin-content-bg', hsl);
      }
      
      if (adminSidebarBg !== '#374151') {
        const hsl = hexToHsl(adminSidebarBg);
        root.style.setProperty('--admin-sidebar-bg', hsl);
      }
      
      if (adminSidebarText !== '#ffffff') {
        const hsl = hexToHsl(adminSidebarText);
        root.style.setProperty('--admin-sidebar-text', hsl);
      }
      
      if (adminPrimary !== '#3b82f6') {
        const hsl = hexToHsl(adminPrimary);
        root.style.setProperty('--admin-primary', hsl);
        root.style.setProperty('--admin-button-bg', hsl);
      }
      
      if (adminTableBg !== '#374151') {
        const hsl = hexToHsl(adminTableBg);
        root.style.setProperty('--admin-table-bg', hsl);
      }
      
      if (adminCardBg !== '#374151') {
        const hsl = hexToHsl(adminCardBg);
        root.style.setProperty('--admin-card', hsl);
      }
    } catch (error) {
      console.error('Erro ao converter cores:', error);
    }

    // Aplicar título personalizado
    if (document.title.includes('Painel') || document.title.includes('Admin') || document.title.includes('Globoplay')) {
      document.title = `${siteName} - Painel Administrativo`;
    }

    // Aplicar favicon personalizado
    if (faviconImage) {
      let favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.href = faviconImage;
      favicon.type = 'image/png';
    }

    // Disparar evento para componentes que precisam reagir
    window.dispatchEvent(new CustomEvent('adminCustomizationUpdated'));
  }, [getCustomization]);

  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      applyAdminStyles();
    }
  }, [applyAdminStyles]);

  return {
    customizations,
    getCustomization,
    refetch,
    applyAdminStyles
  };
};