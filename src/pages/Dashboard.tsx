
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Link } from 'react-router-dom';
import { Users, CreditCard, Package, DollarSign, Settings, LogOut, Gavel, UserCheck, TrendingUp, Calendar, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import AuctionBanner from '@/components/admin/AuctionBanner';
import { useSiteCustomizations } from '@/hooks/useSiteCustomizations';
import { addDays, subDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { siteName, streamingUrl } = useSiteCustomizations();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSubscriptions: 0,
    totalAuctions: 0,
    totalBids: 0,
    totalRegistrations: 0,
    activeAuctions: 0,
    totalRevenue: 0,
    monthlyRevenue: 0
  });
  const [chartData, setChartData] = useState({
    userGrowth: [],
    revenueData: [],
    auctionStats: [],
    bidDistribution: []
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [filterType, setFilterType] = useState('all');

  const fetchStats = async () => {
    if (!user || user.role === 'user') {
      setLoading(false);
      return;
    }

    try {
      // Fetch basic stats
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

      // Fetch revenue data
      const { data: plansData } = await supabase
        .from('plans')
        .select('price, billing_cycle')
        .eq('active', true);

      const { data: subscriptionsData } = await supabase
        .from('subscriptions')
        .select('plan_id, created_at, plans(price)')
        .eq('status', 'active')
        .not('plans', 'is', null);

      const totalRevenue = subscriptionsData?.reduce((sum, sub: any) => 
        sum + (sub.plans?.price || 0), 0) || 0;

      const currentMonth = format(new Date(), 'yyyy-MM');
      const monthlyRevenue = subscriptionsData
        ?.filter((sub: any) => sub.created_at?.startsWith(currentMonth))
        ?.reduce((sum, sub: any) => sum + (sub.plans?.price || 0), 0) || 0;

      setStats({
        totalUsers: usersCount || 0,
        totalSubscriptions: subscriptionsCount || 0,
        totalAuctions: auctionsCount || 0,
        totalBids: bidsCount || 0,
        totalRegistrations: registrationsCount || 0,
        activeAuctions: activeAuctionsCount || 0,
        totalRevenue,
        monthlyRevenue
      });

      // Generate chart data
      await generateChartData();
      
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = async () => {
    try {
      // User growth data
      const { data: usersData } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('created_at', format(dateRange.to, 'yyyy-MM-dd'))
        .order('created_at', { ascending: true });

      const userGrowthMap = new Map();
      usersData?.forEach(user => {
        const date = format(new Date(user.created_at), 'dd/MM', { locale: ptBR });
        userGrowthMap.set(date, (userGrowthMap.get(date) || 0) + 1);
      });

      const userGrowth = Array.from(userGrowthMap.entries()).map(([date, count]) => ({
        date,
        usuarios: count
      }));

      // Revenue data
      const { data: revenueData } = await supabase
        .from('subscriptions')
        .select('created_at, plans(price, name)')
        .eq('status', 'active')
        .gte('created_at', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('created_at', format(dateRange.to, 'yyyy-MM-dd'))
        .not('plans', 'is', null);

      const revenueMap = new Map();
      revenueData?.forEach((sub: any) => {
        const date = format(new Date(sub.created_at), 'dd/MM', { locale: ptBR });
        revenueMap.set(date, (revenueMap.get(date) || 0) + (sub.plans?.price || 0));
      });

      const revenueChartData = Array.from(revenueMap.entries()).map(([date, revenue]) => ({
        date,
        receita: revenue
      }));

      // Auction stats
      const { data: auctionData } = await supabase
        .from('auctions')
        .select('status, auction_type')
        .gte('created_at', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('created_at', format(dateRange.to, 'yyyy-MM-dd'));

      const auctionStats = [
        { name: 'Rurais Ativos', value: auctionData?.filter(a => a.auction_type === 'rural' && a.status === 'active').length || 0 },
        { name: 'Judiciais Ativos', value: auctionData?.filter(a => a.auction_type === 'judicial' && a.status === 'active').length || 0 },
        { name: 'Inativos', value: auctionData?.filter(a => a.status === 'inactive').length || 0 }
      ];

      // Bid distribution
      const { data: bidData } = await supabase
        .from('bids')
        .select('status, bid_value')
        .gte('created_at', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('created_at', format(dateRange.to, 'yyyy-MM-dd'));

      const bidDistribution = [
        { name: 'Aprovados', value: bidData?.filter(b => b.status === 'approved').length || 0, color: '#22c55e' },
        { name: 'Pendentes', value: bidData?.filter(b => b.status === 'pending').length || 0, color: '#f59e0b' },
        { name: 'Rejeitados', value: bidData?.filter(b => b.status === 'rejected').length || 0, color: '#ef4444' }
      ];

      setChartData({
        userGrowth,
        revenueData: revenueChartData,
        auctionStats,
        bidDistribution
      });

    } catch (error) {
      console.error('Error generating chart data:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user, dateRange]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Carregando...</div>
      </div>
    );
  }

  const dashboardStats = user.role === 'user' ? [
    {
      title: 'Suas Habilitações',
      value: '1',
      icon: UserCheck,
      description: 'Habilitações solicitadas',
      color: 'bg-blue-500'
    },
    {
      title: 'Seus Lances',
      value: '0',
      icon: Gavel,
      description: 'Lances realizados',
      color: 'bg-green-500'
    },
    {
      title: 'Leilões Ativos',
      value: loading ? '...' : stats.activeAuctions.toString(),
      icon: Package,
      description: 'Leilões em andamento',
      color: 'bg-yellow-500'
    },
    {
      title: 'Sua Assinatura',
      value: 'Ativa',
      icon: CreditCard,
      description: 'Status da conta',
      color: 'bg-purple-500'
    }
  ] : [
    {
      title: 'Total de Usuários',
      value: loading ? '...' : stats.totalUsers.toString(),
      icon: Users,
      description: 'Usuários cadastrados',
      color: 'bg-blue-500'
    },
    {
      title: 'Total de Leilões',
      value: loading ? '...' : stats.totalAuctions.toString(),
      icon: Gavel,
      description: `${stats.activeAuctions} ativos`,
      color: 'bg-green-500'
    },
    {
      title: 'Receita Total',
      value: loading ? '...' : `R$ ${stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      description: `R$ ${stats.monthlyRevenue.toFixed(2)} este mês`,
      color: 'bg-yellow-500'
    },
    {
      title: 'Habilitações',
      value: loading ? '...' : stats.totalRegistrations.toString(),
      icon: UserCheck,
      description: 'Habilitações solicitadas',
      color: 'bg-purple-500'
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
              
              {/* Streaming Access Button */}
              {streamingUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(streamingUrl, '_blank')}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Package className="h-4 w-4 mr-2" />
                  {siteName}
                </Button>
              )}
              
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

        {/* Filters for Admin */}
        {(user.role === 'admin' || user.role === 'desenvolvedor') && (
          <div className="mb-8 flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filtrar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="revenue">Receita</SelectItem>
                  <SelectItem value="users">Usuários</SelectItem>
                  <SelectItem value="auctions">Leilões</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {dashboardStats.map((stat, index) => (
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
                  <div className={`p-3 rounded-full ${stat.color}`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Section for Admin */}
        {(user.role === 'admin' || user.role === 'desenvolvedor') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* User Growth Chart */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Crescimento de Usuários
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData.userGrowth}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '6px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="usuarios" 
                      stroke="#3b82f6" 
                      fillOpacity={1} 
                      fill="url(#colorUsers)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue Chart */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Receita por Período
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData.revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '6px'
                      }}
                      formatter={(value) => [`R$ ${value}`, 'Receita']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="receita" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Auction Stats */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Gavel className="h-5 w-5" />
                  Status dos Leilões
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.auctionStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Bid Distribution */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Distribuição dos Lances
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.bidDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.bidDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '6px'
                      }}
                    />
                  </PieChart>
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
