
import React, { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import ErrorBoundary from './ErrorBoundary';
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
    <ErrorBoundary>
      <div className="admin-layout-container flex min-h-screen bg-admin-content-bg">
        <ErrorBoundary>
          <AdminSidebar 
            isCollapsed={sidebarCollapsed}
            onToggle={handleToggle}
          />
        </ErrorBoundary>
        <div 
          className="admin-content-main flex-1 min-h-screen bg-admin-content-bg"
          style={{ 
            marginLeft: sidebarCollapsed ? '64px' : '256px',
            background: 'linear-gradient(135deg, hsl(var(--admin-content-bg)) 0%, hsl(var(--admin-muted)) 100%)'
          }}
        >
          <div className="p-6 space-y-6">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default AdminLayout;
