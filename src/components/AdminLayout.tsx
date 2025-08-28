
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { useAdminCustomizations } from '@/hooks/useAdminCustomizations';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { getCustomization } = useAdminCustomizations();
  const navigate = useNavigate();
  const location = useLocation();

  // Ensure we're in an admin route, if not redirect to dashboard
  useEffect(() => {
    const adminPaths = [
      '/dashboard',
      '/admin/usuarios', 
      '/admin/pacotes',
      '/admin/planos',
      '/admin/assinaturas',
      '/admin/cupons',
      '/admin/leiloes',
      '/admin/habilitacoes',
      '/admin/lances',
      '/admin/personalizacao',
      '/profile',
      '/subscription'
    ];
    
    // Check if current path starts with any admin path (to handle query params)
    const isValidPath = adminPaths.some(path => location.pathname === path);
    
    if (!isValidPath) {
      console.log('⚠️ Invalid admin route detected:', location.pathname);
      navigate('/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);

  const handleToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  useEffect(() => {
    const handleCustomizationUpdate = () => {
      // The hook already applies the changes, no need to do anything here
    };

    window.addEventListener('adminCustomizationUpdated', handleCustomizationUpdate);
    
    return () => {
      window.removeEventListener('adminCustomizationUpdated', handleCustomizationUpdate);
    };
  }, []);

  return (
    <div className="admin-layout-container flex min-h-screen bg-black">
      <AdminSidebar 
        isCollapsed={sidebarCollapsed}
        onToggle={handleToggle}
      />
      <div 
        className="admin-content-main flex-1 min-h-screen bg-black overflow-hidden"
        style={{ 
          marginLeft: sidebarCollapsed ? '64px' : '256px'
        }}
      >
        <div className="h-full overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-black rounded-xl border border-green-600/30 shadow-xl p-6 min-h-[calc(100vh-12rem)]">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
