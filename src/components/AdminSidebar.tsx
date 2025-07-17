
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Package, 
  CreditCard, 
  Ticket, 
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Images
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const AdminSidebar = ({ isCollapsed, onToggle }: AdminSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const menuItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/admin/usuarios', icon: Users, label: 'Usuários' },
    { path: '/admin/pacotes', icon: Package, label: 'Pacotes' },
    { path: '/admin/planos', icon: CreditCard, label: 'Planos' },
    { path: '/admin/cupons', icon: Ticket, label: 'Cupons' },
    { path: '/admin/personalizacao', icon: Settings, label: 'Personalização' },
  ];

  return (
    <div className={`bg-admin-sidebar text-admin-sidebar-foreground transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } h-screen relative flex flex-col overflow-y-auto`}>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-6 bg-admin-sidebar border border-admin-border rounded-full p-1 hover:bg-admin-sidebar/80 z-10"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      {/* Logo */}
      <div className="p-4 border-b border-admin-border">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
        >
          <div className="text-admin-primary font-bold text-xl">G</div>
          {!isCollapsed && (
            <span className="font-bold text-lg text-admin-sidebar-foreground">Globoplay Admin</span>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-6 flex-1">
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
              className={`flex items-center w-full px-4 py-3 text-admin-muted-foreground hover:bg-admin-muted transition-colors ${
                isActive ? 'bg-admin-muted border-r-2 border-admin-primary text-admin-sidebar-foreground' : ''
              }`}
            >
              <Icon className="h-5 w-5 min-w-[20px]" />
              {!isCollapsed && (
                <span className="ml-3">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-admin-border mt-auto">
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-3 text-admin-muted-foreground hover:bg-admin-muted transition-colors rounded"
        >
          <LogOut className="h-5 w-5 min-w-[20px]" />
          {!isCollapsed && (
            <span className="ml-3">Sair</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
