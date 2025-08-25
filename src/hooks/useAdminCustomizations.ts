
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
    
    // Cores principais do admin
    const adminContentBg = getCustomization('admin_content_bg_color', '#111827');
    const adminSidebarBg = getCustomization('admin_sidebar_bg_color', '#374151');
    const adminSidebarText = getCustomization('admin_sidebar_text_color', '#ffffff');
    const adminPrimary = getCustomization('admin_primary_color', '#3b82f6');
    const adminTableBg = getCustomization('admin_table_bg_color', '#374151');
    const adminCardBg = getCustomization('admin_card_bg_color', '#374151');
    
    // Novas cores para modais e datatables
    const adminModalBg = getCustomization('admin_modal_bg_color', '#374151');
    const adminModalText = getCustomization('admin_modal_text_color', '#ffffff');
    const adminDatatableBg = getCustomization('admin_datatable_bg_color', '#374151');
    const adminDatatableText = getCustomization('admin_datatable_text_color', '#ffffff');
    const adminDatatableHeader = getCustomization('admin_datatable_header_color', '#1f2937');
    const adminDashboardCard = getCustomization('admin_dashboard_card_color', '#374151');
    const adminDashboardCardText = getCustomization('admin_dashboard_card_text_color', '#ffffff');
    const adminBorder = getCustomization('admin_border_color', '#4b5563');
    const adminAccent = getCustomization('admin_accent_color', '#1f2937');
    const adminForeground = getCustomization('admin_foreground_color', '#ffffff');
    
    // Configurações gerais
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

      // Aplicar novas cores
      if (adminModalBg !== '#374151') {
        const hsl = hexToHsl(adminModalBg);
        root.style.setProperty('--admin-modal-bg', hsl);
      }

      if (adminModalText !== '#ffffff') {
        const hsl = hexToHsl(adminModalText);
        root.style.setProperty('--admin-modal-text', hsl);
      }

      if (adminDatatableBg !== '#374151') {
        const hsl = hexToHsl(adminDatatableBg);
        root.style.setProperty('--admin-datatable-bg', hsl);
      }

      if (adminDatatableText !== '#ffffff') {
        const hsl = hexToHsl(adminDatatableText);
        root.style.setProperty('--admin-datatable-text', hsl);
      }

      if (adminDatatableHeader !== '#1f2937') {
        const hsl = hexToHsl(adminDatatableHeader);
        root.style.setProperty('--admin-datatable-header', hsl);
      }

      if (adminDashboardCard !== '#374151') {
        const hsl = hexToHsl(adminDashboardCard);
        root.style.setProperty('--admin-dashboard-card', hsl);
      }

      if (adminDashboardCardText !== '#ffffff') {
        const hsl = hexToHsl(adminDashboardCardText);
        root.style.setProperty('--admin-dashboard-card-text', hsl);
      }

      if (adminBorder !== '#4b5563') {
        const hsl = hexToHsl(adminBorder);
        root.style.setProperty('--admin-border', hsl);
      }

      if (adminAccent !== '#1f2937') {
        const hsl = hexToHsl(adminAccent);
        root.style.setProperty('--admin-accent', hsl);
      }

      if (adminForeground !== '#ffffff') {
        const hsl = hexToHsl(adminForeground);
        root.style.setProperty('--admin-foreground', hsl);
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
