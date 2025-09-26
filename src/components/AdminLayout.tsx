
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, ChevronDown, LogOut, Settings } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { useAdminCustomizations } from '@/hooks/useAdminCustomizations';
import { useAuth } from '@/contexts/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { getCustomization } = useAdminCustomizations();
  const { user, logout } = useAuth();
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
      '/admin/asaas-api-tester',
      '/admin/imagens',
      '/admin/conteudo',
      '/admin/hero-slider',
      '/admin/dashboard-financeiro',
      '/admin/documentos',
      '/admin/limites-clientes',
      '/admin/auditoria',
      '/profile',
      '/subscription'
    ];
    
    // Consider path prefixes (e.g., query params or nested routes)
    const isValidPath = adminPaths.some(path => location.pathname.startsWith(path));
    
    if (!isValidPath) {
      console.log('⚠️ Invalid admin route detected:', location.pathname);
      navigate('/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);

  const handleToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleUserMenuClick = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setDropdownOpen(false);
  };

  const handleLogoutClick = async () => {
    await logout();
    setDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={handleUserMenuClick}
                  className="flex items-center space-x-3 bg-admin-card border border-admin-border rounded-lg px-4 py-2 hover:bg-admin-muted transition-colors cursor-pointer"
                >
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
                  <ChevronDown className={`h-4 w-4 text-admin-muted-foreground transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-admin-card border border-admin-border rounded-lg shadow-lg z-50">
                    <div className="py-2">
                      <button
                        onClick={handleProfileClick}
                        className="flex items-center w-full px-4 py-2 text-sm text-admin-sidebar-text hover:bg-admin-muted transition-colors"
                      >
                        <Settings className="h-4 w-4 mr-3" />
                        Ver Perfil
                      </button>
                      <button
                        onClick={handleLogoutClick}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Sair
                      </button>
                    </div>
                  </div>
                )}
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
