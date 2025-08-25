
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, DollarSign, ShoppingCart, TrendingUp, Calendar, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/formatters';

interface DateRange {
  from: Date;
  to?: Date;
}

const Dashboard = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date()
  });
  const [filterType, setFilterType] = useState('all');

  // Mock data for charts - in a real app, this would come from your API
  const revenueData = [
    { month: 'Jan', revenue: 4000, subscriptions: 240 },
    { month: 'Fev', revenue: 3000, subscriptions: 139 },
    { month: 'Mar', revenue: 2000, subscriptions: 980 },
    { month: 'Abr', revenue: 2780, subscriptions: 390 },
    { month: 'Mai', revenue: 1890, subscriptions: 480 },
    { month: 'Jun', revenue: 2390, subscriptions: 380 },
  ];

  const auctionData = [
    { name: 'Rurais', value: 400, color: '#8884d8' },
    { name: 'Judiciais', value: 300, color: '#82ca9d' },
    { name: 'Especiais', value: 300, color: '#ffc658' },
  ];

  const bidStatusData = [
    { status: 'Aprovados', count: 45, color: '#10b981' },
    { status: 'Pendentes', count: 12, color: '#f59e0b' },
    { status: 'Rejeitados', count: 8, color: '#ef4444' },
  ];

  const { data: dashboardStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
      if (error) throw error;
      return data;
    }
  });

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range) {
      setDateRange(range);
    }
  };

  const stats = [
    {
      title: "Receita Total",
      value: "R$ 45.231,89",
      change: "+20.1%",
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      title: "Usuários Ativos", 
      value: dashboardStats?.[0]?.total_count || "1.234",
      change: "+180.1%",
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Assinaturas",
      value: "421",
      change: "+19%",
      icon: ShoppingCart,
      color: "text-purple-600"
    },
    {
      title: "Leilões Ativos",
      value: "12",
      change: "+201",
      icon: TrendingUp,
      color: "text-orange-600"
    }
  ];

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <DateRangePicker
            date={dateRange}
            onDateChange={handleDateRangeChange}
          />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="subscriptions">Assinaturas</SelectItem>
              <SelectItem value="auctions">Leilões</SelectItem>
              <SelectItem value="bids">Lances</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className={stat.color}>{stat.change}</span> em relação ao mês anterior
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Revenue Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Receita & Assinaturas</CardTitle>
            <CardDescription>
              Comparativo mensal de receita e novas assinaturas
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(Number(value)) : value,
                    name === 'revenue' ? 'Receita' : 'Assinaturas'
                  ]}
                />
                <Bar dataKey="revenue" fill="#8884d8" />
                <Bar dataKey="subscriptions" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Auction Types Pie Chart */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Tipos de Leilão</CardTitle>
            <CardDescription>
              Distribuição por categoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={auctionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {auctionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bid Status Chart */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Status dos Lances</CardTitle>
            <CardDescription>
              Situação atual dos lances
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bidStatusData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="status" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
            <CardDescription>
              Últimas ações no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: "Novo usuário cadastrado", user: "João Silva", time: "2 min atrás" },
                { action: "Lance aprovado", user: "Maria Santos", time: "5 min atrás" },
                { action: "Leilão finalizado", user: "Admin", time: "10 min atrás" },
                { action: "Assinatura renovada", user: "Carlos Oliveira", time: "15 min atrás" },
                { action: "Nova habilitação", user: "Ana Costa", time: "20 min atrás" }
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.user}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Métricas de Performance</CardTitle>
            <CardDescription>
              Indicadores chave de desempenho
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Taxa de Conversão</span>
                <span className="font-bold text-green-600">3.2%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Ticket Médio</span>
                <span className="font-bold">R$ 89,90</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Churn Rate</span>
                <span className="font-bold text-red-600">2.1%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>LTV</span>
                <span className="font-bold">R$ 430,50</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metas do Mês</CardTitle>
            <CardDescription>
              Progresso em relação aos objetivos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span>Receita</span>
                  <span className="text-sm">R$ 45.231 / R$ 50.000</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '90.5%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span>Novos Usuários</span>
                  <span className="text-sm">421 / 500</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '84.2%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span>Leilões</span>
                  <span className="text-sm">12 / 15</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
