
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { useAdminCustomizations } from '@/hooks/useAdminCustomizations';
import { useAuth } from '@/contexts/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { getCustomization } = useAdminCustomizations();
  const { user } = useAuth();
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
      '/admin/integracao',
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
            {/* User Header */}
            <div className="mb-6 flex items-center justify-end">
              <div className="flex items-center space-x-3 bg-admin-card border border-admin-border rounded-lg px-4 py-2">
                <div className="p-2 bg-admin-primary/20 rounded-full">
                  <User className="h-4 w-4 text-admin-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-admin-sidebar-text">
                    {user?.name || user?.email || 'Usuário'}
                  </span>
                  <span className="text-xs text-admin-muted-foreground">
                    {user?.role === 'admin' ? 'Administrador' : user?.role === 'desenvolvedor' ? 'Desenvolvedor' : 'Usuário'}
                  </span>
                </div>
              </div>
            </div>
            
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
