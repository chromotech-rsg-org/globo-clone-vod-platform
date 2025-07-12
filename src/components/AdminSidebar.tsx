
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  const { logout } = useAuth();

  const menuItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/admin/usuarios', icon: Users, label: 'Usuários' },
    { path: '/admin/pacotes', icon: Package, label: 'Pacotes' },
    { path: '/admin/planos', icon: CreditCard, label: 'Planos' },
    { path: '/admin/cupons', icon: Ticket, label: 'Cupons' },
    { path: '/admin/imagens', icon: Images, label: 'Imagens' },
    { path: '/admin/personalizacao', icon: Settings, label: 'Personalização' },
  ];

  return (
    <div className={`bg-gray-800 text-white transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } min-h-screen relative flex flex-col`}>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-6 bg-gray-800 border border-gray-600 rounded-full p-1 hover:bg-gray-700 z-10"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      {/* Logo */}
      <div className="p-4 border-b border-gray-700">
        <Link to="/" className="flex items-center space-x-2">
          <div className="text-red-500 font-bold text-xl">G</div>
          {!isCollapsed && (
            <span className="font-bold text-lg">Globoplay Admin</span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="mt-6 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 transition-colors ${
                isActive ? 'bg-gray-700 border-r-2 border-red-500 text-white' : ''
              }`}
              onClick={(e) => {
                console.log('🔗 Navegando para:', item.path);
                // Force navigation if needed
                if (location.pathname === item.path) {
                  window.location.reload();
                }
              }}
            >
              <Icon className="h-5 w-5 min-w-[20px]" />
              {!isCollapsed && (
                <span className="ml-3">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-3 text-gray-300 hover:bg-gray-700 transition-colors rounded"
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
