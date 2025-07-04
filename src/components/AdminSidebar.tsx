
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
  ChevronRight
} from 'lucide-react';

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const AdminSidebar = ({ isCollapsed, onToggle }: AdminSidebarProps) => {
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/admin/usuarios', icon: Users, label: 'Usuários' },
    { path: '/admin/pacotes', icon: Package, label: 'Pacotes' },
    { path: '/admin/planos', icon: CreditCard, label: 'Planos' },
    { path: '/admin/cupons', icon: Ticket, label: 'Cupons' },
    { path: '/admin/personalizacao', icon: Settings, label: 'Personalização' },
  ];

  return (
    <div className={`bg-gray-800 text-white transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } min-h-screen relative`}>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-6 bg-gray-800 border border-gray-600 rounded-full p-1 hover:bg-gray-700"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      {/* Logo */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="text-red-500 font-bold text-xl">G</div>
          {!isCollapsed && (
            <span className="font-bold text-lg">Globoplay Admin</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6">
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
            >
              <Icon className="h-5 w-5" />
              {!isCollapsed && (
                <span className="ml-3">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default AdminSidebar;
