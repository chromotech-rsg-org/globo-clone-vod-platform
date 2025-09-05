
import React, { useEffect, useState, useCallback } from 'react';
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
  User,
  Gavel,
  UserCheck,
  HandHeart,
  Bell,
  Plug,
  Settings,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCustomizations } from '@/hooks/useAdminCustomizations';
import { usePendingNotifications } from '@/hooks/usePendingNotifications';
import NotificationBadge from '@/components/auction/NotificationBadge';
import PendingNotificationModal from '@/components/auction/PendingNotificationModal';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

interface MenuItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  pendingCount?: number;
}

const AdminSidebar = ({ isCollapsed, onToggle }: AdminSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { getCustomization } = useAdminCustomizations();
  const { pendingBids, pendingRegistrations, totalPending, loading, hasNewNotifications } = usePendingNotifications();
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const { toast } = useToast();

  // Show toast for new notifications
  useEffect(() => {
    if (hasNewNotifications && totalPending > 0) {
      toast({
        title: "Nova Solicitação",
        description: "Você recebeu uma nova solicitação",
        duration: 5000,
      });
    }
  }, [hasNewNotifications, totalPending, toast]);

  // Check for notification modal reopening flag
  useEffect(() => {
    const shouldReopenNotifications = sessionStorage.getItem('reopenPendingNotifications');
    if (shouldReopenNotifications === '1') {
      sessionStorage.removeItem('reopenPendingNotifications');
      setShowNotificationModal(true);
    }
  }, [location.pathname]);

  // Listen for custom event to open notifications modal
  useEffect(() => {
    const handleOpenNotifications = () => {
      setShowNotificationModal(true);
    };

    window.addEventListener('openPendingNotifications', handleOpenNotifications);
    return () => {
      window.removeEventListener('openPendingNotifications', handleOpenNotifications);
    };
  }, []);

  // Stable navigation handler to prevent session timeouts
  const handleNavigation = useCallback((path: string) => {
    if (isNavigating) return;
    
    setIsNavigating(true);
    console.log('🔗 Navegando para:', path);
    
    try {
      navigate(path);
      
      setTimeout(() => {
        setIsNavigating(false);
      }, 500);
    } catch (error) {
      console.error('❌ Navigation error:', error);
      setIsNavigating(false);
    }
  }, [navigate, isNavigating]);

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
  const isDeveloper = user?.role === 'desenvolvedor';
  const isClient = user?.role === 'user';

  const adminMenuItems: MenuItem[] = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/admin/usuarios', icon: Users, label: 'Usuários' },
    { path: '/admin/planos', icon: CreditCard, label: 'Planos' },
    { path: '/admin/assinaturas', icon: CreditCard, label: 'Assinaturas' },
    { path: '/admin/cupons', icon: Ticket, label: 'Cupons' },
    { path: '/admin/leiloes', icon: Gavel, label: 'Leilões' },
    { 
      path: '/admin/habilitacoes', 
      icon: UserCheck, 
      label: 'Habilitações',
      pendingCount: pendingRegistrations.length
    },
    { 
      path: '/admin/lances', 
      icon: HandHeart, 
      label: 'Lances',
      pendingCount: pendingBids.length
    },
  ];

  const developerConfigItems: MenuItem[] = [
    { path: '/admin/pacotes', icon: Package, label: 'Pacotes' },
    { path: '/admin/personalizacao', icon: Palette, label: 'Personalização' },
    { path: '/admin/integracao', icon: Plug, label: 'Integração MOTV' },
  ];

  const clientMenuItems: MenuItem[] = [
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
            onClick={() => handleNavigation('/')} 
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
            <div className="ml-auto flex items-center gap-2">
              {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-admin-primary"></div>
              ) : (
                <>
                  <NotificationBadge 
                    count={totalPending} 
                    onClick={() => setShowNotificationModal(true)} 
                  />
                  {hasNewNotifications && (
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-2 flex-1 overflow-y-auto px-3 space-y-1">
        {/* External Links Section */}
        {!isCollapsed && (
          <div className="mb-4">
            <div className="text-xs text-admin-muted-foreground uppercase tracking-wide font-semibold px-3 py-2 mb-2">
              Navegação Externa
            </div>
            <div className="space-y-1">
              <button
                onClick={() => window.open('/', '_blank')}
                className="group flex items-center w-full px-3 py-3 text-admin-muted-foreground hover:bg-admin-muted hover:text-admin-sidebar-text transition-all duration-200 rounded-lg"
                title="Abrir Home em nova aba"
              >
                <Home className="h-5 w-5 min-w-[20px] group-hover:scale-105 transition-transform" />
                <span className="ml-3 font-medium">Ir para Home</span>
                <ExternalLink className="h-4 w-4 ml-auto opacity-50" />
              </button>
              <button
                onClick={() => window.open('/auctions', '_blank')}
                className="group flex items-center w-full px-3 py-3 text-admin-muted-foreground hover:bg-admin-muted hover:text-admin-sidebar-text transition-all duration-200 rounded-lg"
                title="Abrir Leilões em nova aba"
              >
                <Gavel className="h-5 w-5 min-w-[20px] group-hover:scale-105 transition-transform" />
                <span className="ml-3 font-medium">Ver Leilões</span>
                <ExternalLink className="h-4 w-4 ml-auto opacity-50" />
              </button>
            </div>
          </div>
        )}
        
        {/* Collapsed External Links */}
        {isCollapsed && (
          <div className="mb-4 space-y-1">
            <button
              onClick={() => window.open('/', '_blank')}
              className="group flex items-center justify-center w-full px-3 py-3 text-admin-muted-foreground hover:bg-admin-muted hover:text-admin-sidebar-text transition-all duration-200 rounded-lg hover:scale-102"
              title="Ir para Home (nova aba)"
            >
              <Home className="h-5 w-5 min-w-[20px] group-hover:scale-105 transition-transform" />
            </button>
            <button
              onClick={() => window.open('/auctions', '_blank')}
              className="group flex items-center justify-center w-full px-3 py-3 text-admin-muted-foreground hover:bg-admin-muted hover:text-admin-sidebar-text transition-all duration-200 rounded-lg hover:scale-102"
              title="Ver Leilões (nova aba)"
            >
              <Gavel className="h-5 w-5 min-w-[20px] group-hover:scale-105 transition-transform" />
            </button>
          </div>
        )}

        {/* Admin Menu Items */}
        {!isCollapsed && (
          <div className="text-xs text-admin-muted-foreground uppercase tracking-wide font-semibold px-3 py-2 mb-2">
            Painel Administrativo
          </div>
        )}
        
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const hasPending = item.pendingCount && item.pendingCount > 0;
          
          return (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              disabled={isNavigating}
              className={`group flex items-center justify-between w-full px-3 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-admin-primary text-admin-primary-foreground shadow-md scale-105' 
                  : 'text-admin-muted-foreground hover:bg-admin-muted hover:text-admin-sidebar-text hover:scale-102'
              } ${isNavigating ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <div className="flex items-center">
                <Icon className={`h-5 w-5 min-w-[20px] transition-transform duration-200 ${
                  isActive ? 'scale-110' : 'group-hover:scale-105'
                }`} />
                {!isCollapsed && (
                  <span className="ml-3 font-medium">{item.label}</span>
                )}
              </div>
              
              {((hasPending && !isCollapsed) || (isActive && !isCollapsed)) && (
                <div className="flex items-center gap-2">
                  {hasPending && !isCollapsed && (
                    <Badge variant="destructive" className="text-xs">
                      {item.pendingCount}
                    </Badge>
                  )}
                  {isActive && !isCollapsed && (
                    <div className="w-2 h-2 bg-admin-primary-foreground rounded-full animate-pulse"></div>
                  )}
                </div>
              )}
            </button>
          );
        })}

        {/* Developer Configuration Accordion - Only for developers */}
        {isDeveloper && !isCollapsed && (
          <div className="mt-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="configurations" className="border-admin-border">
                <AccordionTrigger className="text-admin-muted-foreground hover:text-admin-sidebar-text px-3 py-3 hover:no-underline">
                  <div className="flex items-center">
                    <Settings className="h-5 w-5 min-w-[20px] mr-3" />
                    <span className="font-medium">Configurações</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="space-y-1 ml-3">
                    {developerConfigItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      
                      return (
                        <button
                          key={item.path}
                          onClick={() => handleNavigation(item.path)}
                          disabled={isNavigating}
                          className={`group flex items-center w-full px-3 py-2 rounded-lg transition-all duration-200 ${
                            isActive 
                              ? 'bg-admin-primary text-admin-primary-foreground shadow-md' 
                              : 'text-admin-muted-foreground hover:bg-admin-muted hover:text-admin-sidebar-text'
                          } ${isNavigating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Icon className={`h-4 w-4 min-w-[16px] transition-transform duration-200 ${
                            isActive ? 'scale-110' : 'group-hover:scale-105'
                          }`} />
                          <span className="ml-3 font-medium text-sm">{item.label}</span>
                          {isActive && (
                            <div className="w-2 h-2 bg-admin-primary-foreground rounded-full animate-pulse ml-auto"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}

        {/* Developer Configuration - Collapsed state */}
        {isDeveloper && isCollapsed && (
          <div className="mt-4 space-y-1">
            {developerConfigItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  disabled={isNavigating}
                  className={`group flex items-center justify-center w-full px-3 py-3 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-admin-primary text-admin-primary-foreground shadow-md scale-105' 
                      : 'text-admin-muted-foreground hover:bg-admin-muted hover:text-admin-sidebar-text hover:scale-102'
                  } ${isNavigating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={item.label}
                >
                  <Icon className={`h-5 w-5 min-w-[20px] transition-transform duration-200 ${
                    isActive ? 'scale-110' : 'group-hover:scale-105'
                  }`} />
                </button>
              );
            })}
          </div>
        )}
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
