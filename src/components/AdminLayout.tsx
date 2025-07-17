
import React, { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import { useAdminCustomizations } from '@/hooks/useAdminCustomizations';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { getCustomization } = useAdminCustomizations();

  const handleToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  useEffect(() => {
    // Listen for customization updates
    const handleCustomizationUpdate = () => {
      // The hook already applies the changes, no need to do anything here
    };

    window.addEventListener('adminCustomizationUpdated', handleCustomizationUpdate);
    
    return () => {
      window.removeEventListener('adminCustomizationUpdated', handleCustomizationUpdate);
    };
  }, []);

  const contentBgColor = getCustomization('admin_content_bg', '#111827');

  return (
    <div className="flex min-h-screen bg-admin-content-bg">
      <div className="fixed left-0 top-0 h-screen z-10">
        <AdminSidebar 
          isCollapsed={sidebarCollapsed}
          onToggle={handleToggle}
        />
      </div>
      <div 
        className="flex-1 h-screen overflow-y-auto transition-all duration-300 bg-admin-content-bg"
        style={{ 
          marginLeft: sidebarCollapsed ? '64px' : '256px'
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
