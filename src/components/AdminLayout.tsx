
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
            <div className="bg-black rounded-xl border border-green-600/30 shadow-xl p-6 min-h-[calc(100vh-6rem)]">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
