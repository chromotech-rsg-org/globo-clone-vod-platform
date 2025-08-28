
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Users, CreditCard, Package, DollarSign, Settings, LogOut, Gavel, UserCheck, TrendingUp, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AuctionBanner from '@/components/admin/AuctionBanner';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSubscriptions: 0,
    totalAuctions: 0,
    totalBids: 0,
    totalRegistrations: 0,
    activeAuctions: 0
  });
  const [loading, setLoading] = useState(true);

  // Dados mockados para os gráficos (em um sistema real, viriam do backend)
  const monthlyData = [
    { name: 'Jan', usuarios: 120, lances: 450, receita: 15000 },
    { name: 'Fev', usuarios: 185, lances: 680, receita: 22000 },
    { name: 'Mar', usuarios: 230, lances: 820, receita: 28000 },
    { name: 'Abr', usuarios: 278, lances: 950, receita: 35000 },
    { name: 'Mai', usuarios: 320, lances: 1200, receita: 42000 },
    { name: 'Jun', usuarios: 385, lances: 1450, receita: 48000 },
  ];

  const pieData = [
    { name: 'Usuários Ativos', value: 65, color: '#22c55e' },
    { name: 'Usuários Inativos', value: 25, color: '#6b7280' },
    { name: 'Novos Usuários', value: 10, color: '#10b981' },
  ];

  const auctionStatusData = [
    { name: 'Ativos', value: 12, color: '#22c55e' },
    { name: 'Finalizados', value: 45, color: '#6b7280' },
    { name: 'Pendentes', value: 8, color: '#f59e0b' },
  ];

  const fetchStats = async () => {
    if (!user || user.role === 'user') {
      setLoading(false);
      return;
    }

    try {
      // Buscar estatísticas em paralelo
      const [
        { count: usersCount },
        { count: subscriptionsCount },
        { count: auctionsCount },
        { count: bidsCount },
        { count: registrationsCount },
        { count: activeAuctionsCount }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('*', { count: 'exact', head: true }),
        supabase.from('auctions').select('*', { count: 'exact', head: true }),
        supabase.from('bids').select('*', { count: 'exact', head: true }),
        supabase.from('auction_registrations').select('*', { count: 'exact', head: true }),
        supabase.from('auctions').select('*', { count: 'exact', head: true }).eq('status', 'active')
      ]);

      setStats({
        totalUsers: usersCount || 0,
        totalSubscriptions: subscriptionsCount || 0,
        totalAuctions: auctionsCount || 0,
        totalBids: bidsCount || 0,
        totalRegistrations: registrationsCount || 0,
        activeAuctions: activeAuctionsCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  const dashboardStats = user.role === 'user' ? [
    {
      title: 'Suas Habilitações',
      value: '1',
      icon: UserCheck,
      description: 'Habilitações solicitadas',
      color: 'from-green-600 to-green-800'
    },
    {
      title: 'Seus Lances',
      value: '0',
      icon: Gavel,
      description: 'Lances realizados',
      color: 'from-green-500 to-green-700'
    },
    {
      title: 'Leilões Ativos',
      value: loading ? '...' : stats.activeAuctions.toString(),
      icon: Package,
      description: 'Leilões em andamento',
      color: 'from-green-400 to-green-600'
    },
    {
      title: 'Sua Assinatura',
      value: 'Ativa',
      icon: CreditCard,
      description: 'Status da conta',
      color: 'from-green-600 to-green-800'
    }
  ] : [
    {
      title: 'Total de Usuários',
      value: loading ? '...' : stats.totalUsers.toString(),
      icon: Users,
      description: 'Usuários cadastrados',
      color: 'from-green-600 to-green-800'
    },
    {
      title: 'Total de Leilões',
      value: loading ? '...' : stats.totalAuctions.toString(),
      icon: Gavel,
      description: `${stats.activeAuctions} ativos`,
      color: 'from-green-500 to-green-700'
    },
    {
      title: 'Total de Lances',
      value: loading ? '...' : stats.totalBids.toString(),
      icon: DollarSign,
      description: 'Lances realizados',
      color: 'from-green-400 to-green-600'
    },
    {
      title: 'Habilitações',
      value: loading ? '...' : stats.totalRegistrations.toString(),
      icon: UserCheck,
      description: 'Habilitações solicitadas',
      color: 'from-green-600 to-green-800'
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
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-black border-b border-green-600/30">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-white">
                Dashboard {user.role === 'user' ? 'Pessoal' : 'Administrativo'}
              </h1>
              <Badge 
                variant="secondary" 
                className="bg-green-600 text-white hover:bg-green-700"
              >
                {user.role}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">Olá, {user.name}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="border-green-600 text-green-200 hover:bg-green-600 hover:text-white transition-colors"
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
          {dashboardStats.map((stat, index) => (
            <Card key={index} className="bg-black border border-green-600/30 green-glow">
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
                  <div className={`p-3 rounded-full bg-gradient-to-r ${stat.color}`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Section for Admin */}
        {(user.role === 'admin' || user.role === 'desenvolvedor') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Line Chart */}
            <Card className="bg-black border border-green-600/30 green-glow">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                  Crescimento Mensal
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Usuários e lances por mês
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#111827', 
                        border: '1px solid #22c55e',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="usuarios" 
                      stroke="#22c55e" 
                      strokeWidth={3}
                      name="Usuários"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="lances" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      name="Lances"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Area Chart */}
            <Card className="bg-black border border-green-600/30 green-glow">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-400" />
                  Receita Mensal
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Evolução da receita ao longo do tempo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#111827', 
                        border: '1px solid #22c55e',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="receita" 
                      stroke="#22c55e" 
                      fill="url(#colorReceita)"
                      strokeWidth={2}
                    />
                    <defs>
                      <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Pie Chart - User Distribution */}
            <Card className="bg-black border border-green-600/30 green-glow">
              <CardHeader>
                <CardTitle className="text-white">Distribuição de Usuários</CardTitle>
                <CardDescription className="text-gray-400">
                  Status dos usuários na plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#111827', 
                        border: '1px solid #22c55e',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Bar Chart - Auction Status */}
            <Card className="bg-black border border-green-600/30 green-glow">
              <CardHeader>
                <CardTitle className="text-white">Status dos Leilões</CardTitle>
                <CardDescription className="text-gray-400">
                  Distribuição por status dos leilões
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={auctionStatusData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#111827', 
                        border: '1px solid #22c55e',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Admin Menu */}
        {(user.role === 'admin' || user.role === 'desenvolvedor') && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Área Administrativa</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adminMenuItems.map((item, index) => (
                <Card key={index} className="bg-black border border-green-600/30 hover:border-green-500 transition-all duration-300 green-glow hover:shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-white">{item.title}</CardTitle>
                    <CardDescription className="text-gray-400">
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to={item.href}>
                      <Button className="w-full bg-green-600 hover:bg-green-700 text-white transition-colors">
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
    </div>
  );
};

export default Dashboard;
