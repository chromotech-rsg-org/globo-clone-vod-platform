import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Home, Users, Package, CreditCard, Ticket, Palette, Gavel, UserCheck, HandHeart, Bell, Plug, Settings, ExternalLink, BarChart3, Shield, FolderOpen, DollarSign, FileSpreadsheet, User, LogOut } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuth } from '@/contexts/AuthContext';
import { usePendingNotifications } from '@/hooks/usePendingNotifications';
import { useAdminCustomizations } from '@/hooks/useAdminCustomizations';
import NotificationBadge from '@/components/auction/NotificationBadge';

interface MenuItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  pendingCount?: number;
}

interface MobileAdminMenuProps {
  onNotificationClick: () => void;
}

const MobileAdminMenu: React.FC<MobileAdminMenuProps> = ({ onNotificationClick }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { getCustomization } = useAdminCustomizations();
  const { pendingBids, pendingRegistrations, totalPending } = usePendingNotifications();

  const isAdmin = user?.role === 'admin' || user?.role === 'desenvolvedor';
  const isDeveloper = user?.role === 'desenvolvedor';
  const isClient = user?.role === 'user';

  const adminMenuItems: MenuItem[] = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/admin/dashboard-financeiro', icon: BarChart3, label: 'Dashboard Financeiro' },
    { path: '/admin/usuarios', icon: Users, label: 'Usuários' },
    { path: '/admin/planos', icon: CreditCard, label: 'Planos' },
    { path: '/admin/assinaturas', icon: CreditCard, label: 'Assinaturas' },
    { path: '/admin/cupons', icon: Ticket, label: 'Cupons' },
    { path: '/admin/leiloes', icon: Gavel, label: 'Leilões' },
    { path: '/admin/habilitacoes', icon: UserCheck, label: 'Habilitações', pendingCount: pendingRegistrations.length },
    { path: '/admin/lances', icon: HandHeart, label: 'Lances', pendingCount: pendingBids.length },
    { path: '/admin/documentos', icon: FolderOpen, label: 'Documentos' },
    { path: '/admin/limites-clientes', icon: DollarSign, label: 'Limites Clientes' },
    { path: '/admin/relatorios', icon: FileSpreadsheet, label: 'Relatórios' },
    { path: '/admin/auditoria', icon: Shield, label: 'Auditoria' },
  ];

  const developerConfigItems: MenuItem[] = [
    { path: '/admin/pacotes', icon: Package, label: 'Pacotes' },
    { path: '/admin/personalizacao', icon: Palette, label: 'Personalização' },
    { path: '/admin/integracao', icon: Plug, label: 'Integração MOTV' },
    { path: '/admin/asaas-api-tester', icon: CreditCard, label: 'Integração Asaas' },
  ];

  const clientMenuItems: MenuItem[] = [
    { path: '/profile', icon: User, label: 'Meu Perfil' },
    { path: '/subscription', icon: CreditCard, label: 'Minha Assinatura' },
  ];

  const menuItems = isAdmin ? adminMenuItems : clientMenuItems;
  const siteName = getCustomization('global_site_name', 'Painel Admin');
  const adminLogo = getCustomization('admin_logo_image', '');

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-gray-800">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] bg-black border-green-600/30 text-white overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-2">
              {adminLogo ? (
                <img src={adminLogo} alt="Logo" className="w-8 h-8 object-contain rounded" />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-700 rounded flex items-center justify-center text-white font-bold">
                  G
                </div>
              )}
              <span className="text-sm font-bold">{siteName}</span>
            </div>
            
            {isAdmin && (
              <NotificationBadge 
                count={totalPending} 
                onClick={() => {
                  setIsOpen(false);
                  onNotificationClick();
                }} 
              />
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-1">
          {/* External Links */}
          <div className="mb-4 space-y-1">
            <button
              onClick={() => {
                window.open('/', '_blank');
                setIsOpen(false);
              }}
              className="flex items-center w-full px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors rounded-lg"
            >
              <Home className="h-5 w-5 mr-3" />
              <span className="text-sm">Ir para Home</span>
              <ExternalLink className="h-4 w-4 ml-auto opacity-50" />
            </button>
            <button
              onClick={() => {
                window.open('/auctions', '_blank');
                setIsOpen(false);
              }}
              className="flex items-center w-full px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors rounded-lg"
            >
              <Gavel className="h-5 w-5 mr-3" />
              <span className="text-sm">Ver Leilões</span>
              <ExternalLink className="h-4 w-4 ml-auto opacity-50" />
            </button>
            <a
              href="https://portal.agroplay.tv.br/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex items-center w-full px-3 py-2 border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white transition-colors rounded-lg"
            >
              {adminLogo && (
                <img src={adminLogo} alt="" className="h-5 w-5 mr-3" />
              )}
              <span className="text-sm font-medium">Agroplay</span>
            </a>
          </div>

          {/* Menu Items */}
          <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold px-3 py-2 mb-2">
            Menu Principal
          </div>
          
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const hasPending = item.pendingCount && item.pendingCount > 0;
            
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-green-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <div className="flex items-center">
                  <Icon className="h-5 w-5 mr-3" />
                  <span className="text-sm">{item.label}</span>
                </div>
                {hasPending && (
                  <Badge variant="destructive" className="text-xs">
                    {item.pendingCount}
                  </Badge>
                )}
              </button>
            );
          })}

          {/* Developer Config */}
          {isDeveloper && (
            <div className="mt-4">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="config" className="border-gray-700">
                  <AccordionTrigger className="text-gray-300 hover:text-white px-3 py-2">
                    <div className="flex items-center">
                      <Settings className="h-5 w-5 mr-3" />
                      <span className="text-sm">Configurações</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-0">
                    <div className="space-y-1 ml-6">
                      {developerConfigItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        
                        return (
                          <button
                            key={item.path}
                            onClick={() => handleNavigation(item.path)}
                            className={`flex items-center w-full px-3 py-2 rounded-lg transition-colors ${
                              isActive 
                                ? 'bg-green-600 text-white' 
                                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                            }`}
                          >
                            <Icon className="h-4 w-4 mr-3" />
                            <span className="text-sm">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

          {/* User Info & Logout */}
          <div className="mt-6 pt-4 border-t border-gray-700 space-y-1">
            <div className="px-3 py-2 text-gray-400 text-xs">
              {user?.name || user?.email}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-red-400 hover:bg-red-900/20 transition-colors rounded-lg"
            >
              <LogOut className="h-5 w-5 mr-3" />
              <span className="text-sm">Sair</span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileAdminMenu;