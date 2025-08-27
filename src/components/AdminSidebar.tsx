
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Gavel,
  UserCheck,
  TrendingUp,
  CreditCard,
  Settings,
  Palette,
  Images,
  FileText,
  Gift,
  Package,
  Monitor
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const AdminSidebar = () => {
  const location = useLocation();
  const { user } = useAuth();

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/users', icon: Users, label: 'Usuários' },
    { path: '/admin/auctions', icon: Gavel, label: 'Leilões' },
    { path: '/admin/habilitacoes', icon: UserCheck, label: 'Habilitações' },
    { path: '/admin/bids', icon: TrendingUp, label: 'Lances' },
    { path: '/admin/subscriptions', icon: CreditCard, label: 'Assinaturas' },
    { path: '/admin/plans', icon: Package, label: 'Planos' },
    { path: '/admin/packages', icon: Package, label: 'Pacotes' },
    { path: '/admin/coupons', icon: Gift, label: 'Cupons' },
    { path: '/admin/content', icon: FileText, label: 'Conteúdo' },
    { path: '/admin/hero-slider', icon: Monitor, label: 'Slider Hero' },
    { path: '/admin/images', icon: Images, label: 'Imagens' },
  ];

  // Add developer-only menu items
  if (user?.role === 'desenvolvedor') {
    menuItems.push(
      { path: '/admin/customizations', icon: Palette, label: 'Personalizações' },
      { path: '/admin/customization', icon: Settings, label: 'Configurações' }
    );
  }

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-64 bg-gray-800 border-r border-gray-700 min-h-screen">
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
