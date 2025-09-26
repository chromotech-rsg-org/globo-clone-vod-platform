import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBidLimits } from '@/hooks/useBidLimits';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, UserCheck, UserX, DollarSign, AlertTriangle, Check, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/utils/formatters';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/components/AdminLayout';

const LimitesClientes: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [limitDialogOpen, setLimitDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [limitData, setLimitData] = useState({
    userId: '',
    maxLimit: 10000,
    isUnlimited: false
  });

  const { 
    limits, 
    requests, 
    loading, 
    systemSettings, 
    createOrUpdateLimit, 
    reviewLimitRequest,
    refetch 
  } = useBidLimits();

  const filteredLimits = limits.filter(limit => 
    searchTerm === '' || 
    limit.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    limit.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingRequests = requests.filter(req => req.status === 'pending');

  const handleCreateLimit = async () => {
    if (!limitData.userId) return;
    
    await createOrUpdateLimit(limitData.userId, limitData.maxLimit, limitData.isUnlimited);
    setLimitDialogOpen(false);
    setLimitData({ userId: '', maxLimit: 10000, isUnlimited: false });
    await refetch();
  };

  const handleReviewRequest = async (approved: boolean, customLimit?: number) => {
    if (!selectedRequest) return;
    
    await reviewLimitRequest(selectedRequest.id, approved, customLimit);
    setReviewDialogOpen(false);
    setSelectedRequest(null);
    await refetch();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-600/20 text-yellow-400 border-yellow-400';
      case 'approved': return 'bg-green-600/20 text-green-400 border-green-400';
      case 'rejected': return 'bg-red-600/20 text-red-400 border-red-400';
      default: return 'bg-gray-600/20 text-gray-400 border-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'approved': return 'Aprovado';
      case 'rejected': return 'Rejeitado';
      default: return status;
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-admin-table-text">Limites por Cliente</h1>
            <p className="text-admin-muted-foreground">
              Gerencie limites de lance e solicitações de aumento
            </p>
          </div>
          <Dialog open={limitDialogOpen} onOpenChange={setLimitDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                <DollarSign className="h-4 w-4 mr-2" />
                Definir Limite
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-admin-content-bg border-admin-border">
              <DialogHeader>
                <DialogTitle className="text-admin-table-text">Definir Limite do Cliente</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-admin-table-text">ID do Usuário</Label>
                  <Input
                    value={limitData.userId}
                    onChange={(e) => setLimitData(prev => ({ ...prev, userId: e.target.value }))}
                    placeholder="Informe o ID do usuário"
                    className="bg-admin-content-bg border-admin-border text-admin-table-text"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={limitData.isUnlimited}
                    onCheckedChange={(checked) => setLimitData(prev => ({ ...prev, isUnlimited: checked }))}
                  />
                  <Label className="text-admin-table-text">Limite ilimitado</Label>
                </div>

                {!limitData.isUnlimited && (
                  <div>
                    <Label className="text-admin-table-text">Limite Máximo</Label>
                    <Input
                      type="number"
                      min={systemSettings.minLimit}
                      value={limitData.maxLimit}
                      onChange={(e) => setLimitData(prev => ({ ...prev, maxLimit: parseInt(e.target.value) || 0 }))}
                      className="bg-admin-content-bg border-admin-border text-admin-table-text"
                    />
                    <p className="text-xs text-admin-muted-foreground mt-1">
                      Valor mínimo: {formatCurrency(systemSettings.minLimit)}
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setLimitDialogOpen(false)}
                    className="text-admin-table-text border-admin-border"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCreateLimit}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Salvar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Estatísticas */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-admin-content-bg border-admin-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-admin-table-text">Clientes com Limite</CardTitle>
              <UserCheck className="h-4 w-4 text-admin-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-admin-table-text">{limits.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-admin-content-bg border-admin-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-admin-table-text">Solicitações Pendentes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-admin-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">{pendingRequests.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-admin-content-bg border-admin-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-admin-table-text">Limite Padrão</CardTitle>
              <DollarSign className="h-4 w-4 text-admin-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {formatCurrency(systemSettings.defaultLimit)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="limites" className="space-y-4">
          <TabsList className="bg-admin-content-bg border border-admin-border">
            <TabsTrigger value="limites" className="text-admin-table-text">
              Limites Ativos ({limits.length})
            </TabsTrigger>
            <TabsTrigger value="solicitacoes" className="text-admin-table-text">
              Solicitações ({pendingRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="limites" className="space-y-4">
            {/* Busca */}
            <Card className="bg-admin-content-bg border-admin-border">
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-admin-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nome ou e-mail..."
                    className="pl-10 bg-admin-content-bg border-admin-border text-admin-table-text"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Lista de Limites */}
            <Card className="bg-admin-content-bg border-admin-border">
              <CardHeader>
                <CardTitle className="text-admin-table-text">
                  Limites Configurados ({filteredLimits.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full bg-gray-800" />
                        <Skeleton className="h-4 w-1/3 bg-gray-800" />
                        <Skeleton className="h-4 w-1/4 bg-gray-800" />
                        <Skeleton className="h-4 w-1/5 bg-gray-800" />
                      </div>
                    ))}
                  </div>
                ) : filteredLimits.length === 0 ? (
                  <div className="text-center text-admin-muted-foreground py-8">
                    Nenhum limite configurado
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredLimits.map((limit) => (
                      <div key={limit.id} className="border border-admin-border rounded-lg p-4 hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium text-admin-table-text">
                                {limit.user?.name || 'Usuário Desconhecido'}
                              </h4>
                              {limit.is_unlimited ? (
                                <Badge className="bg-blue-600/20 text-blue-400 border-blue-400">
                                  Ilimitado
                                </Badge>
                              ) : (
                                <Badge className="bg-green-600/20 text-green-400 border-green-400">
                                  {formatCurrency(limit.max_limit)}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="text-admin-muted-foreground text-sm">
                              {limit.user?.email || 'E-mail não disponível'}
                            </div>
                            
                            <div className="text-admin-muted-foreground text-sm">
                              Configurado em: {format(new Date(limit.created_at), "dd/MM/yyyy", { locale: ptBR })}
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setLimitData({
                                userId: limit.user_id,
                                maxLimit: limit.max_limit,
                                isUnlimited: limit.is_unlimited
                              });
                              setLimitDialogOpen(true);
                            }}
                            className="text-admin-table-text border-admin-border"
                          >
                            Editar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="solicitacoes" className="space-y-4">
            <Card className="bg-admin-content-bg border-admin-border">
              <CardHeader>
                <CardTitle className="text-admin-table-text">
                  Solicitações de Aumento ({requests.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 bg-gray-800" />
                    ))}
                  </div>
                ) : requests.length === 0 ? (
                  <div className="text-center text-admin-muted-foreground py-8">
                    Nenhuma solicitação encontrada
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map((request) => (
                      <div key={request.id} className="border border-admin-border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium text-admin-table-text">
                                {request.user?.name || 'Usuário Desconhecido'}
                              </h4>
                              <Badge className={getStatusColor(request.status)}>
                                {getStatusLabel(request.status)}
                              </Badge>
                            </div>
                            
                            <div className="text-admin-muted-foreground text-sm mb-2">
                              {request.user?.email || 'E-mail não disponível'}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                              <div>
                                <span className="text-admin-muted-foreground">Limite atual:</span>
                                <div className="text-admin-table-text font-semibold">
                                  {formatCurrency(request.current_limit)}
                                </div>
                              </div>
                              <div>
                                <span className="text-admin-muted-foreground">Limite solicitado:</span>
                                <div className="text-green-400 font-semibold">
                                  {formatCurrency(request.requested_limit)}
                                </div>
                              </div>
                            </div>

                            {request.reason && (
                              <div className="text-sm">
                                <span className="text-admin-muted-foreground">Motivo:</span>
                                <div className="text-admin-table-text mt-1 bg-gray-900 p-2 rounded">
                                  {request.reason}
                                </div>
                              </div>
                            )}
                          </div>

                          {request.status === 'pending' && (
                            <div className="flex gap-2 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setReviewDialogOpen(true);
                                }}
                                className="text-admin-table-text border-admin-border"
                              >
                                Revisar
                              </Button>
                            </div>
                          )}
                        </div>

                        <div className="text-xs text-admin-muted-foreground">
                          Solicitado em: {format(new Date(request.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          {request.reviewed_at && (
                            <> • Revisado em: {format(new Date(request.reviewed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog de Revisão */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent className="bg-admin-content-bg border-admin-border">
            <DialogHeader>
              <DialogTitle className="text-admin-table-text">Revisar Solicitação</DialogTitle>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="bg-gray-900 p-4 rounded">
                  <h4 className="font-medium text-admin-table-text mb-2">Detalhes da Solicitação</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Cliente:</strong> {selectedRequest.user?.name}</div>
                    <div><strong>Limite atual:</strong> {formatCurrency(selectedRequest.current_limit)}</div>
                    <div><strong>Limite solicitado:</strong> {formatCurrency(selectedRequest.requested_limit)}</div>
                    <div><strong>Diferença:</strong> +{formatCurrency(selectedRequest.requested_limit - selectedRequest.current_limit)}</div>
                    {selectedRequest.reason && (
                      <div><strong>Motivo:</strong> {selectedRequest.reason}</div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setReviewDialogOpen(false)}
                    className="text-admin-table-text border-admin-border"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleReviewRequest(false)}
                    className="text-red-400 border-red-400 hover:bg-red-400/10"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Rejeitar
                  </Button>
                  <Button 
                    onClick={() => handleReviewRequest(true)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Aprovar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default LimitesClientes;