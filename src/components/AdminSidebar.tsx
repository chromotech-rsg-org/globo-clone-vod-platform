
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Package, 
  CreditCard, 
  Ticket, 
  Palette,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Images,
  FileText,
  Presentation,
  User,
  Gavel,
  UserCheck,
  HandHeart
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCustomizations } from '@/hooks/useAdminCustomizations';
import { usePendingNotifications } from '@/hooks/usePendingNotifications';
import NotificationBadge from '@/components/auction/NotificationBadge';
import PendingNotificationModal from '@/components/auction/PendingNotificationModal';

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const AdminSidebar = ({ isCollapsed, onToggle }: AdminSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { getCustomization } = useAdminCustomizations();
  const { pendingBids, pendingRegistrations, totalPending, loading } = usePendingNotifications();
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // Listen for customization updates
  useEffect(() => {
    const handleCustomizationUpdate = () => {
      // The colors are applied via CSS variables, no need for manual updates
    };

    window.addEventListener('adminCustomizationUpdated', handleCustomizationUpdate);
    
    return () => {
      window.removeEventListener('adminCustomizationUpdated', handleCustomizationUpdate);
    };
  }, []);

  const isAdmin = user?.role === 'admin' || user?.role === 'desenvolvedor';
  const isClient = user?.role === 'user';

  const adminMenuItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/admin/usuarios', icon: Users, label: 'Usuários' },
    { path: '/admin/pacotes', icon: Package, label: 'Pacotes' },
    { path: '/admin/planos', icon: CreditCard, label: 'Planos' },
    { path: '/admin/assinaturas', icon: CreditCard, label: 'Assinaturas' },
    { path: '/admin/cupons', icon: Ticket, label: 'Cupons' },
    { path: '/admin/leiloes', icon: Gavel, label: 'Leilões' },
    { path: '/admin/habilitacoes', icon: UserCheck, label: 'Habilitações' },
    { path: '/admin/lances', icon: HandHeart, label: 'Lances' },
    { path: '/admin/personalizacao', icon: Palette, label: 'Personalização' },
  ];

  const clientMenuItems = [
    { path: '/profile', icon: User, label: 'Meu Perfil' },
    { path: '/subscription', icon: CreditCard, label: 'Minha Assinatura' },
  ];

  const menuItems = isAdmin ? adminMenuItems : clientMenuItems;

  const siteName = getCustomization('global_site_name', 'Painel Administrativo');
  const adminLogo = getCustomization('admin_logo_image', '');

  return (
    <div 
      id="admin-sidebar-unique"
      className={`transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-64'
      } h-screen fixed left-0 top-0 flex flex-col bg-admin-sidebar-bg text-admin-sidebar-text shadow-lg z-50 border-r border-admin-border`}
      style={{
        backdropFilter: 'blur(8px)',
        backgroundColor: 'rgba(var(--admin-sidebar-bg), 0.95)'
      }}
    >
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-4 top-6 bg-admin-content-bg border-2 border-admin-border rounded-full p-2 hover:bg-admin-muted transition-all duration-200 shadow-lg z-[60]"
        style={{
          color: 'hsl(var(--admin-primary))'
        }}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      {/* Logo */}
      <div className="p-6 border-b border-admin-border/50">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center space-x-3 hover:opacity-80 transition-all duration-200 group"
          >
            {adminLogo ? (
              <img src={adminLogo} alt="Logo" className="w-10 h-10 object-contain rounded-lg" />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-admin-primary to-admin-accent rounded-lg flex items-center justify-center text-admin-primary-foreground font-bold text-xl shadow-md">
                G
              </div>
            )}
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-lg text-admin-sidebar-text group-hover:text-admin-primary transition-colors">
                  {siteName}
                </span>
                <span className="text-xs text-admin-muted-foreground">
                  Painel Administrativo
                </span>
              </div>
            )}
          </button>
          
          {/* Notification Badge - Apenas para admins */}
          {isAdmin && !isCollapsed && (
            <div className="ml-auto">
              {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-admin-primary"></div>
              ) : (
                <NotificationBadge 
                  count={totalPending} 
                  onClick={() => setShowNotificationModal(true)} 
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-2 flex-1 overflow-y-auto px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => {
                console.log('🔗 Navegando para:', item.path);
                navigate(item.path);
              }}
              className={`group flex items-center w-full px-3 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-admin-primary text-admin-primary-foreground shadow-md scale-105' 
                  : 'text-admin-muted-foreground hover:bg-admin-muted hover:text-admin-sidebar-text hover:scale-102'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`h-5 w-5 min-w-[20px] transition-transform duration-200 ${
                isActive ? 'scale-110' : 'group-hover:scale-105'
              }`} />
              {!isCollapsed && (
                <span className="ml-3 font-medium">{item.label}</span>
              )}
              {isActive && !isCollapsed && (
                <div className="ml-auto w-2 h-2 bg-admin-primary-foreground rounded-full animate-pulse"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-admin-border/50 mt-auto">
        <button
          onClick={logout}
          className="group flex items-center w-full px-3 py-3 text-admin-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 rounded-lg"
          title={isCollapsed ? 'Sair' : undefined}
        >
          <LogOut className="h-5 w-5 min-w-[20px] group-hover:scale-105 transition-transform" />
          {!isCollapsed && (
            <span className="ml-3 font-medium">Sair</span>
          )}
        </button>
      </div>

      {/* Modal de Notificações */}
      {isAdmin && (
        <PendingNotificationModal
          open={showNotificationModal}
          onOpenChange={setShowNotificationModal}
          pendingBids={pendingBids}
          pendingRegistrations={pendingRegistrations}
        />
      )}
    </div>
  );
};

export default AdminSidebar;
