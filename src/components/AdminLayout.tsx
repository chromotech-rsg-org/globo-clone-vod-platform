
import React, { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import { useCustomizations } from '@/hooks/useCustomizations';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { getCustomization } = useCustomizations('admin');

  const handleToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  useEffect(() => {
    // Aplicar cores personalizadas ao montar o componente
    const applyAdminColors = () => {
      const root = document.documentElement;
      
      // Função para converter hex para HSL
      const hexToHsl = (hex: string): string => {
        if (!hex || !hex.startsWith('#')) return '';
        
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

      // Aplicar cores do sistema
      const colors = {
        'admin_primary_color': '--admin-primary',
        'admin_button_bg_color': '--admin-button-bg',
        'admin_button_text_color': '--admin-button-text',
        'admin_button_hover_color': '--admin-button-hover',
        'admin_sidebar_bg': '--admin-sidebar-bg',
        'admin_sidebar_text_color': '--admin-sidebar-text',
        'admin_content_bg': '--admin-content-bg',
        'admin_dashboard_text_color': '--admin-dashboard-text',
        'admin_table_header_bg': '--admin-table-header',
        'admin_table_bg_color': '--admin-table-bg',
        'admin_table_text_color': '--admin-table-text',
        'admin_success_color': '--admin-success',
        'admin_danger_color': '--admin-danger',
        'admin_warning_color': '--admin-warning'
      };

      Object.entries(colors).forEach(([key, cssVar]) => {
        const color = getCustomization('colors', key.replace('admin_', ''), '');
        if (color) {
          const hslColor = hexToHsl(color);
          if (hslColor) {
            root.style.setProperty(cssVar, hslColor);
          }
        }
      });
    };

    applyAdminColors();

    // Listener para atualizações de cores
    const handleColorUpdate = () => {
      applyAdminColors();
    };

    window.addEventListener('adminColorsUpdated', handleColorUpdate);
    
    return () => {
      window.removeEventListener('adminColorsUpdated', handleColorUpdate);
    };
  }, [getCustomization]);

  const contentBg = getCustomization('colors', 'content_bg', '#111827');

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: contentBg }}>
      <div className="fixed left-0 top-0 h-screen z-10">
        <AdminSidebar 
          isCollapsed={sidebarCollapsed}
          onToggle={handleToggle}
        />
      </div>
      <div 
        className="flex-1 h-screen overflow-y-auto transition-all duration-300"
        style={{ 
          marginLeft: sidebarCollapsed ? '64px' : '256px',
          backgroundColor: contentBg
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
