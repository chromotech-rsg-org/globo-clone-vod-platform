import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { formatCurrency } from '@/utils/formatters';
import { Loader2, TrendingUp, Users, FileText, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const DashboardFinanceiro: React.FC = () => {
  const { generalStats, financialStats, insightStats, loading, error } = useDashboardStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        <span className="ml-2 text-admin-table-text">Carregando estatísticas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-400">
        <AlertCircle className="h-8 w-8 mr-2" />
        <span>Erro ao carregar dados: {error}</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-admin-table-text">Dashboard Financeiro</h1>
            <p className="text-admin-muted-foreground">Visão completa do desempenho do sistema</p>
          </div>
        </div>

        <Tabs defaultValue="geral" className="space-y-4">
          <TabsList className="bg-admin-content-bg border border-admin-border">
            <TabsTrigger value="geral" className="text-admin-table-text">Geral</TabsTrigger>
            <TabsTrigger value="financeiro" className="text-admin-table-text">Financeiro</TabsTrigger>
            <TabsTrigger value="leiloes" className="text-admin-table-text">Leilões</TabsTrigger>
            <TabsTrigger value="insights" className="text-admin-table-text">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-admin-content-bg border-admin-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-admin-table-text">Total de Usuários</CardTitle>
                  <Users className="h-4 w-4 text-admin-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-admin-table-text">{generalStats?.total_users || 0}</div>
                </CardContent>
              </Card>

              <Card className="bg-admin-content-bg border-admin-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-admin-table-text">Total Arrecadado</CardTitle>
                  <TrendingUp className="h-4 w-4 text-admin-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-400">
                    {formatCurrency(generalStats?.total_revenue || 0)}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-admin-content-bg border-admin-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-admin-table-text">Lances Aprovados</CardTitle>
                  <TrendingUp className="h-4 w-4 text-admin-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-admin-table-text">{generalStats?.total_bids || 0}</div>
                </CardContent>
              </Card>

              <Card className="bg-admin-content-bg border-admin-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-admin-table-text">Documentos</CardTitle>
                  <FileText className="h-4 w-4 text-admin-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-admin-table-text">{generalStats?.documents_count || 0}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-admin-content-bg border-admin-border">
                <CardHeader>
                  <CardTitle className="text-admin-table-text">Estatísticas Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-admin-table-text">
                    <span>Leilões Ativos:</span>
                    <Badge variant="outline" className="text-green-400 border-green-400">
                      {generalStats?.active_auctions || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-admin-table-text">
                    <span>Registros Pendentes:</span>
                    <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                      {generalStats?.pending_registrations || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-admin-table-text">
                    <span>Solicitações de Limite:</span>
                    <Badge variant="outline" className="text-orange-400 border-orange-400">
                      {generalStats?.limit_requests_pending || 0}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-admin-content-bg border-admin-border">
                <CardHeader>
                  <CardTitle className="text-admin-table-text">Resumo do Sistema</CardTitle>
                  <CardDescription className="text-admin-muted-foreground">
                    Principais métricas de performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-admin-table-text">
                    <div>Total de Leilões: <span className="font-semibold">{generalStats?.total_auctions || 0}</span></div>
                    <div>Receita Média por Lance: <span className="font-semibold text-green-400">
                      {generalStats?.total_bids && generalStats?.total_revenue 
                        ? formatCurrency(generalStats.total_revenue / generalStats.total_bids)
                        : formatCurrency(0)
                      }
                    </span></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="financeiro" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-admin-content-bg border-admin-border">
                <CardHeader>
                  <CardTitle className="text-admin-table-text">Top Arrematantes</CardTitle>
                  <CardDescription className="text-admin-muted-foreground">
                    Maiores valores arrematados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {financialStats?.top_bidders?.slice(0, 5).map((bidder, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="text-admin-table-text">
                          <div className="font-medium">{bidder.user_name}</div>
                          <div className="text-sm text-admin-muted-foreground">
                            {bidder.total_bids} arrematações
                          </div>
                        </div>
                        <div className="text-green-400 font-semibold">
                          {formatCurrency(bidder.total_value)}
                        </div>
                      </div>
                    )) || []}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-admin-content-bg border-admin-border">
                <CardHeader>
                  <CardTitle className="text-admin-table-text">Arrematações Recentes</CardTitle>
                  <CardDescription className="text-admin-muted-foreground">
                    Últimas arrematações realizadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {financialStats?.recent_winners?.slice(0, 5).map((winner, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="text-admin-table-text font-medium">{winner.user_name}</div>
                          <div className="text-green-400 font-semibold">
                            {formatCurrency(winner.winning_bid)}
                          </div>
                        </div>
                        <div className="text-xs text-admin-muted-foreground">
                          {winner.lot_name} - {winner.auction_name}
                        </div>
                      </div>
                    )) || []}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="leiloes" className="space-y-4">
            <Card className="bg-admin-content-bg border-admin-border">
              <CardHeader>
                <CardTitle className="text-admin-table-text">Performance dos Leilões</CardTitle>
                <CardDescription className="text-admin-muted-foreground">
                  Resultados financeiros por leilão
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {financialStats?.auction_performance?.map((auction, index) => (
                    <div key={index} className="border border-admin-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-admin-table-text">{auction.auction_name}</h4>
                        <div className="text-green-400 font-semibold">
                          {formatCurrency(auction.total_revenue)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-admin-muted-foreground">
                        <span>Lotes: {auction.finished_lots}/{auction.total_lots}</span>
                        <span>
                          {auction.total_lots > 0 
                            ? Math.round((auction.finished_lots / auction.total_lots) * 100)
                            : 0
                          }% concluído
                        </span>
                      </div>
                    </div>
                  )) || []}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-admin-content-bg border-admin-border">
                <CardHeader>
                  <CardTitle className="text-admin-table-text">Clientes Potenciais</CardTitle>
                  <CardDescription className="text-admin-muted-foreground">
                    Participam frequentemente mas arrematam pouco
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {insightStats?.potential_clients?.slice(0, 5).map((client, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="text-admin-table-text">
                          <div className="font-medium">{client.user_name}</div>
                          <div className="text-sm text-admin-muted-foreground">
                            {client.participation_count} participações
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-admin-table-text font-semibold">
                            {formatCurrency(client.avg_bid_value)}
                          </div>
                          <div className="text-xs text-admin-muted-foreground">
                            Média por lance
                          </div>
                        </div>
                      </div>
                    )) || []}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-admin-content-bg border-admin-border">
                <CardHeader>
                  <CardTitle className="text-admin-table-text">Oportunidades Perdidas</CardTitle>
                  <CardDescription className="text-admin-muted-foreground">
                    Clientes que ficaram com o penúltimo lance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {insightStats?.missed_opportunities?.slice(0, 5).map((opportunity, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="text-admin-table-text font-medium">
                            {opportunity.user_name}
                          </div>
                          <div className="text-orange-400 font-semibold">
                            +{formatCurrency(opportunity.difference)}
                          </div>
                        </div>
                        <div className="text-xs text-admin-muted-foreground">
                          {opportunity.lot_name} - Lance: {formatCurrency(opportunity.last_bid)}
                        </div>
                      </div>
                    )) || []}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-admin-content-bg border-admin-border">
              <CardHeader>
                <CardTitle className="text-admin-table-text">Clientes Fidelizados</CardTitle>
                <CardDescription className="text-admin-muted-foreground">
                  Maior participação e taxa de sucesso
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insightStats?.loyal_clients?.slice(0, 8).map((client, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="text-admin-table-text">
                        <div className="font-medium">{client.user_name}</div>
                        <div className="text-sm text-admin-muted-foreground">
                          {client.auctions_participated} leilões, {client.total_bids} lances
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant="outline" 
                          className={
                            client.win_rate > 20 ? "text-green-400 border-green-400" :
                            client.win_rate > 10 ? "text-yellow-400 border-yellow-400" :
                            "text-red-400 border-red-400"
                          }
                        >
                          {client.win_rate.toFixed(1)}% sucesso
                        </Badge>
                      </div>
                    </div>
                  )) || []}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
};

export default DashboardFinanceiro;