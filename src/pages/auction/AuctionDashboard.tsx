import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuctionDetails } from '@/hooks/useAuctions';
import { useAuctionStats } from '@/hooks/useAuctionStats';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { ArrowLeft, Users, Gavel, Trophy, TrendingUp, Target, Clock, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

interface DashboardStats {
  totalBids: number;
  totalRegistrations: number;
  approvedBids: number;
  pendingBids: number;
  rejectedBids: number;
  approvedRegistrations: number;
  pendingRegistrations: number;
  rejectedRegistrations: number;
  hasWinner: boolean;
  winnerBidValue?: number;
  highestBidValue: number;
  averageBidValue: number;
  bidsByHour: { hour: string; count: number; value: number }[];
  bidsByStatus: { name: string; value: number; color: string }[];
  registrationsByStatus: { name: string; value: number; color: string }[];
}

const AuctionDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const { auction, loading: auctionLoading } = useAuctionDetails(id!);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = async () => {
    if (!id) return;

    try {
      setLoading(true);

      // Buscar estatísticas dos lances
      const { data: bidsData, error: bidsError } = await supabase
        .from('bids')
        .select('*')
        .eq('auction_id', id);

      if (bidsError) throw bidsError;

      // Buscar estatísticas das habilitações
      const { data: registrationsData, error: registrationsError } = await supabase
        .from('auction_registrations')
        .select('*')
        .eq('auction_id', id);

      if (registrationsError) throw registrationsError;

      const bids = bidsData || [];
      const registrations = registrationsData || [];

      // Calcular estatísticas
      const totalBids = bids.length;
      const totalRegistrations = registrations.length;
      const approvedBids = bids.filter(b => b.status === 'approved').length;
      const pendingBids = bids.filter(b => b.status === 'pending').length;
      const rejectedBids = bids.filter(b => b.status === 'rejected').length;
      const approvedRegistrations = registrations.filter(r => r.status === 'approved').length;
      const pendingRegistrations = registrations.filter(r => r.status === 'pending').length;
      const rejectedRegistrations = registrations.filter(r => r.status === 'rejected').length;

      const hasWinner = bids.some(b => b.is_winner);
      const winnerBid = bids.find(b => b.is_winner);
      const winnerBidValue = winnerBid?.bid_value;
      const highestBidValue = bids.length > 0 ? Math.max(...bids.map(b => b.bid_value)) : 0;
      const averageBidValue = bids.length > 0 ? bids.reduce((sum, b) => sum + b.bid_value, 0) / bids.length : 0;

      // Agrupar lances por hora
      const bidsByHour = bids.reduce((acc, bid) => {
        const hour = new Date(bid.created_at).getHours();
        const hourKey = `${hour}:00`;
        
        if (!acc[hourKey]) {
          acc[hourKey] = { hour: hourKey, count: 0, value: 0 };
        }
        acc[hourKey].count++;
        acc[hourKey].value += bid.bid_value;
        return acc;
      }, {} as Record<string, { hour: string; count: number; value: number }>);

      // Estatísticas para gráficos
      const bidsByStatus = [
        { name: 'Aprovados', value: approvedBids, color: '#22c55e' },
        { name: 'Pendentes', value: pendingBids, color: '#f59e0b' },
        { name: 'Rejeitados', value: rejectedBids, color: '#ef4444' },
        { name: 'Superados', value: bids.filter(b => b.status === 'superseded').length, color: '#6b7280' }
      ].filter(item => item.value > 0);

      const registrationsByStatus = [
        { name: 'Aprovadas', value: approvedRegistrations, color: '#22c55e' },
        { name: 'Pendentes', value: pendingRegistrations, color: '#f59e0b' },
        { name: 'Rejeitadas', value: rejectedRegistrations, color: '#ef4444' }
      ].filter(item => item.value > 0);

      setStats({
        totalBids,
        totalRegistrations,
        approvedBids,
        pendingBids,
        rejectedBids,
        approvedRegistrations,
        pendingRegistrations,
        rejectedRegistrations,
        hasWinner,
        winnerBidValue,
        highestBidValue,
        averageBidValue,
        bidsByHour: Object.values(bidsByHour).sort((a, b) => parseInt(a.hour) - parseInt(b.hour)),
        bidsByStatus,
        registrationsByStatus
      });

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [id]);

  if (auctionLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Leilão não encontrado</h2>
          <p className="text-muted-foreground">O leilão que você está procurando não existe.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link to="/admin/auctions">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <h1 className="text-3xl font-bold text-foreground">Dashboard do Leilão</h1>
            </div>
            <div className="flex gap-2">
              <Link to={`/auctions/${auction.id}`}>
                <Button variant="outline">
                  Ver Leilão
                </Button>
              </Link>
              <Badge variant={auction.is_live ? "default" : "secondary"}>
                {auction.is_live ? 'AO VIVO' : 'GRAVADO'}
              </Badge>
            </div>
          </div>
          
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-2">{auction.name}</h2>
            {auction.description && (
              <p className="text-muted-foreground mb-4">{auction.description}</p>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Tipo:</span>
                <div className="font-medium">{auction.auction_type === 'rural' ? 'Rural' : 'Judicial'}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <div className="font-medium capitalize">{auction.status}</div>
              </div>
              {auction.start_date && (
                <div>
                  <span className="text-muted-foreground">Início:</span>
                  <div className="font-medium">{formatDateTime(auction.start_date)}</div>
                </div>
              )}
              {auction.end_date && (
                <div>
                  <span className="text-muted-foreground">Fim:</span>
                  <div className="font-medium">{formatDateTime(auction.end_date)}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Lances</CardTitle>
              <Gavel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalBids || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.approvedBids || 0} aprovados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Habilitações</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalRegistrations || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.approvedRegistrations || 0} aprovadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lance Inicial</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(auction.initial_bid_value)}</div>
              <p className="text-xs text-muted-foreground">
                Incremento: {formatCurrency(auction.bid_increment)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stats?.hasWinner ? 'Valor Arrematado' : 'Lance Atual'}
              </CardTitle>
              {stats?.hasWinner ? (
                <Trophy className="h-4 w-4 text-green-500" />
              ) : (
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats?.hasWinner ? 'text-green-600' : ''}`}>
                {stats?.hasWinner && stats?.winnerBidValue 
                  ? formatCurrency(stats.winnerBidValue)
                  : formatCurrency(auction.current_bid_value)
                }
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.hasWinner ? 'Leilão finalizado' : 'Em andamento'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de Lances por Status */}
          <Card>
            <CardHeader>
              <CardTitle>Lances por Status</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.bidsByStatus && stats.bidsByStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.bidsByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {stats.bidsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum lance registrado
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Habilitações por Status */}
          <Card>
            <CardHeader>
              <CardTitle>Habilitações por Status</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.registrationsByStatus && stats.registrationsByStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.registrationsByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {stats.registrationsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma habilitação registrada
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Lances por Hora */}
        {stats?.bidsByHour && stats.bidsByHour.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Atividade de Lances por Hora</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={stats.bidsByHour}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'count' ? `${value} lances` : formatCurrency(Number(value)),
                      name === 'count' ? 'Quantidade' : 'Valor Total'
                    ]}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="count" fill="#3b82f6" name="Quantidade de Lances" />
                  <Bar yAxisId="right" dataKey="value" fill="#10b981" name="Valor Total" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Estatísticas Detalhadas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo dos Lances</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-medium">{stats?.totalBids || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Aprovados:</span>
                <span className="font-medium text-green-600">{stats?.approvedBids || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pendentes:</span>
                <span className="font-medium text-yellow-600">{stats?.pendingBids || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rejeitados:</span>
                <span className="font-medium text-red-600">{stats?.rejectedBids || 0}</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lance Médio:</span>
                  <span className="font-medium">{formatCurrency(stats?.averageBidValue || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Maior Lance:</span>
                  <span className="font-medium">{formatCurrency(stats?.highestBidValue || 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo das Habilitações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-medium">{stats?.totalRegistrations || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Aprovadas:</span>
                <span className="font-medium text-green-600">{stats?.approvedRegistrations || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pendentes:</span>
                <span className="font-medium text-yellow-600">{stats?.pendingRegistrations || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rejeitadas:</span>
                <span className="font-medium text-red-600">{stats?.rejectedRegistrations || 0}</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa de Aprovação:</span>
                  <span className="font-medium">
                    {stats?.totalRegistrations 
                      ? `${Math.round((stats.approvedRegistrations / stats.totalRegistrations) * 100)}%`
                      : '0%'
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status do Leilão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={auction.status === 'active' ? 'default' : 'secondary'}>
                  {auction.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transmissão:</span>
                <Badge variant={auction.is_live ? 'default' : 'secondary'}>
                  {auction.is_live ? 'Ao Vivo' : 'Gravado'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vencedor:</span>
                <Badge variant={stats?.hasWinner ? 'default' : 'outline'}>
                  {stats?.hasWinner ? 'Sim' : 'Não'}
                </Badge>
              </div>
              {stats?.hasWinner && (
                <div className="pt-2 border-t">
                  <div className="text-center">
                    <Trophy className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="font-medium text-green-600">Leilão Finalizado!</p>
                    <p className="text-sm text-muted-foreground">
                      Valor: {formatCurrency(stats.winnerBidValue || 0)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuctionDashboard;