
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Users, CreditCard, Package, DollarSign, Settings, LogOut } from 'lucide-react';


const Dashboard = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total de Usuários',
      value: user.role === 'user' ? '1' : '1,234',
      icon: Users,
      description: user.role === 'user' ? 'Sua conta' : 'Usuários cadastrados'
    },
    {
      title: 'Clientes Ativos',
      value: user.role === 'user' ? '1' : '987',
      icon: CreditCard,
      description: user.role === 'user' ? 'Sua assinatura' : 'Assinaturas ativas'
    },
    {
      title: 'Total de Assinaturas',
      value: user.role === 'user' ? '1' : '1,567',
      icon: Package,
      description: user.role === 'user' ? 'Plano ativo' : 'Assinaturas totais'
    },
    {
      title: 'Valor Total',
      value: user.role === 'user' ? 'R$ 442,80' : 'R$ 45,678',
      icon: DollarSign,
      description: user.role === 'user' ? 'Valor anual' : 'Receita total'
    }
  ];

  const adminMenuItems = [
    { title: 'Gerenciar Usuários', href: '/admin/usuarios', description: 'Visualizar e editar usuários' },
    { title: 'Cadastrar Pacotes', href: '/admin/pacotes', description: 'Gerenciar pacotes de conteúdo' },
    { title: 'Cadastrar Planos', href: '/admin/planos', description: 'Configurar planos de assinatura' },
    { title: 'Cupons de Desconto', href: '/admin/cupons', description: 'Criar e gerenciar cupons' },
    { title: 'Personalização', href: '/admin/personalizacao', description: 'Personalizar aparência do sistema' }
  ];

  return (
    <>
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-white">
                Dashboard {user.role === 'user' ? 'Pessoal' : 'Administrativo'}
              </h1>
              <Badge variant="secondary">{user.role}</Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">Olá, {user.name}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Dashboard {user.role === 'user' ? 'Pessoal' : 'Administrativo'}
          </h1>
          <p className="text-gray-400">
            {user.role === 'user' 
              ? 'Visualize informações da sua conta e assinatura'
              : 'Gerencie usuários, planos e assinaturas da plataforma'
            }
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-500">
                      {stat.description}
                    </p>
                  </div>
                  <stat.icon className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Admin Menu */}
        {(user.role === 'admin' || user.role === 'desenvolvedor') && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Área Administrativa</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adminMenuItems.map((item, index) => (
                <Card key={index} className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-white">{item.title}</CardTitle>
                    <CardDescription className="text-gray-400">
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to={item.href}>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        <Settings className="h-4 w-4 mr-2" />
                        Acessar
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;
