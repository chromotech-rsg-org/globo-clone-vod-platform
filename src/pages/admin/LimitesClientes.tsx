import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBidLimits } from '@/hooks/useBidLimits';
import { ClientLimitCard } from '@/components/admin/ClientLimitCard';
import { ReviewRequestModal } from '@/components/admin/ReviewRequestModal';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, UserCheck, UserX, DollarSign, AlertTriangle, Check, X, Users, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/utils/formatters';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Client {
  id: string;
  name: string;
  email: string;
  cpf?: string;
  phone?: string;
}

const LimitesClientes: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [limitDialogOpen, setLimitDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [minLimitDialogOpen, setMinLimitDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [newMinLimit, setNewMinLimit] = useState(0);
  const [limitData, setLimitData] = useState({
    userId: '',
    maxLimit: 10000,
    isUnlimited: false
  });

  const { 
    limits, 
    requests, 
    failedAttempts,
    loading, 
    systemSettings, 
    createOrUpdateLimit, 
    reviewLimitRequest,
    updateMinLimit,
    refetch 
  } = useBidLimits();

  const fetchClients = async () => {
    if (!clientSearchTerm || clientSearchTerm.length < 2) {
      setClients([]);
      return;
    }

    try {
      setLoadingClients(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, cpf, phone')
        .or(`name.ilike.%${clientSearchTerm}%,email.ilike.%${clientSearchTerm}%,cpf.ilike.%${clientSearchTerm}%`)
        .limit(10);

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoadingClients(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClients();
    }, 300);

    return () => clearTimeout(timer);
  }, [clientSearchTerm]);

  const filteredLimits = limits.filter(limit => 
    searchTerm === '' || 
    limit.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    limit.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingRequests = requests.filter(req => req.status === 'pending');

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setLimitData(prev => ({ ...prev, userId: client.id }));
    setClients([]);
    setClientSearchTerm('');
  };

  const handleCreateLimit = async () => {
    if (!limitData.userId) return;
    
    // Validar se o limite não é menor que o mínimo (exceto se for ilimitado)
    if (!limitData.isUnlimited && limitData.maxLimit < systemSettings.minLimit) {
      toast({
        title: "Limite inválido",
        description: `O limite não pode ser menor que ${formatCurrency(systemSettings.minLimit)}`,
        variant: "destructive"
      });
      return;
    }
    
    await createOrUpdateLimit(limitData.userId, limitData.maxLimit, limitData.isUnlimited);
    setLimitDialogOpen(false);
    setLimitData({ userId: '', maxLimit: 10000, isUnlimited: false });
    setSelectedClient(null);
    await refetch();
  };

  const handleUpdateMinLimit = async () => {
    if (newMinLimit <= 0) {
      toast({
        title: "Valor inválido",
        description: "O limite mínimo deve ser maior que zero",
        variant: "destructive"
      });
      return;
    }

    try {
      await updateMinLimit(newMinLimit);
      setMinLimitDialogOpen(false);
      await refetch();
    } catch (error) {
      // Erro já tratado no hook
    }
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
            <DialogContent className="bg-admin-content-bg border-admin-border max-w-md">
              <DialogHeader>
                <DialogTitle className="text-admin-table-text">Definir Limite do Cliente</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-admin-table-text">Buscar Cliente</Label>
                  <div className="relative">
                    <Input
                      value={clientSearchTerm}
                      onChange={(e) => setClientSearchTerm(e.target.value)}
                      placeholder="Digite nome, e-mail ou CPF..."
                      className="bg-admin-content-bg border-admin-border text-admin-table-text"
                    />
                    {loadingClients && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full" />
                      </div>
                    )}
                  </div>
                  
                  {clients.length > 0 && (
                    <div className="mt-2 max-h-40 overflow-y-auto border border-admin-border rounded-md bg-admin-content-bg">
                      {clients.map((client) => (
                        <button
                          key={client.id}
                          onClick={() => handleClientSelect(client)}
                          className="w-full text-left p-3 hover:bg-gray-800/50 border-b border-admin-border last:border-b-0"
                        >
                          <div className="text-admin-table-text font-medium">{client.name}</div>
                          <div className="text-admin-muted-foreground text-sm">
                            {client.email} {client.cpf && `• ${client.cpf}`}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedClient && (
                    <div className="mt-2 p-3 bg-green-600/10 border border-green-600/30 rounded-md">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-green-400" />
                        <div>
                          <div className="text-admin-table-text font-medium">{selectedClient.name}</div>
                          <div className="text-admin-muted-foreground text-sm">{selectedClient.email}</div>
                        </div>
                      </div>
                    </div>
                  )}
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
                    onClick={() => {
                      setLimitDialogOpen(false);
                      setSelectedClient(null);
                      setClientSearchTerm('');
                      setClients([]);
                    }}
                    className="text-admin-table-text border-admin-border"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCreateLimit}
                    disabled={!selectedClient}
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
              <CardTitle className="text-sm font-medium text-admin-table-text">Tentativas Bloqueadas</CardTitle>
              <AlertCircle className="h-4 w-4 text-admin-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">{failedAttempts.length}</div>
            </CardContent>
          </Card>

          <Card 
            className="bg-admin-content-bg border-admin-border cursor-pointer hover:border-green-600/50 transition-colors"
            onClick={() => {
              setNewMinLimit(systemSettings.minLimit);
              setMinLimitDialogOpen(true);
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-admin-table-text">Limite Mínimo</CardTitle>
              <DollarSign className="h-4 w-4 text-admin-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {formatCurrency(systemSettings.minLimit)}
              </div>
              <p className="text-xs text-admin-muted-foreground mt-1">
                Clique para editar
              </p>
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
            <TabsTrigger value="tentativas" className="text-admin-table-text">
              Tentativas Bloqueadas ({failedAttempts.length})
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="bg-admin-content-bg border-admin-border">
                    <CardHeader>
                      <Skeleton className="h-6 w-2/3 bg-gray-800" />
                      <Skeleton className="h-4 w-1/2 bg-gray-800 mt-2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full bg-gray-800" />
                    </CardContent>
                  </Card>
                ))
              ) : filteredLimits.length === 0 ? (
                <div className="col-span-full">
                  <Card className="bg-admin-content-bg border-admin-border">
                    <CardContent className="text-center text-admin-muted-foreground py-12">
                      Nenhum limite configurado
                    </CardContent>
                  </Card>
                </div>
              ) : (
                filteredLimits.map((limit) => {
                  const userRequests = requests.filter(req => req.user_id === limit.user_id && req.status === 'pending');
                  const userFailedAttempts = failedAttempts
                    .filter(attempt => attempt.user_id === limit.user_id)
                    .slice(0, 5)
                    .map(attempt => ({
                      id: attempt.id,
                      attempted_bid_value: attempt.attempted_bid_value,
                      auction_name: attempt.auction?.name || 'Leilão desconhecido',
                      lot_name: attempt.auction_item?.name || 'Lote desconhecido',
                      created_at: attempt.created_at
                    }));

                  return (
                    <ClientLimitCard
                      key={limit.id}
                      userName={limit.user?.name || 'Usuário Desconhecido'}
                      userEmail={limit.user?.email || 'Email não disponível'}
                      currentLimit={limit.max_limit}
                      isUnlimited={limit.is_unlimited}
                      pendingRequests={userRequests}
                      failedAttempts={userFailedAttempts}
                      onReviewRequest={(requestId) => {
                        const request = requests.find(r => r.id === requestId);
                        setSelectedRequest(request);
                        setReviewDialogOpen(true);
                      }}
                      onEditLimit={() => {
                         setLimitData({
                          userId: limit.user_id,
                          maxLimit: limit.max_limit,
                          isUnlimited: limit.is_unlimited
                        });
                        setSelectedClient({ 
                          id: limit.user_id, 
                          name: limit.user?.name || '', 
                          email: limit.user?.email || '' 
                        });
                        setLimitDialogOpen(true);
                      }}
                    />
                  );
                })
              )}
            </div>
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

          <TabsContent value="tentativas" className="space-y-4">
            <Card className="bg-admin-content-bg border-admin-border">
              <CardHeader>
                <CardTitle className="text-admin-table-text">
                  Tentativas Bloqueadas ({failedAttempts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 bg-gray-800" />
                    ))}
                  </div>
                ) : failedAttempts.length === 0 ? (
                  <div className="text-center text-admin-muted-foreground py-8">
                    Nenhuma tentativa bloqueada encontrada
                  </div>
                ) : (
                  <div className="space-y-4">
                    {failedAttempts.map((attempt) => (
                      <div key={attempt.id} className="border border-red-500/30 bg-red-900/10 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <AlertCircle className="h-5 w-5 text-red-400" />
                              <h4 className="font-medium text-admin-table-text">
                                {attempt.user?.name || 'Usuário Desconhecido'}
                              </h4>
                              <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
                                Bloqueado
                              </Badge>
                            </div>
                            
                            <div className="text-admin-muted-foreground text-sm mb-2">
                              {attempt.user?.email || 'E-mail não disponível'}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                              <div>
                                <span className="text-admin-muted-foreground">Leilão:</span>
                                <div className="text-admin-table-text font-medium">
                                  {attempt.auction?.name || 'Leilão desconhecido'}
                                </div>
                              </div>
                              <div>
                                <span className="text-admin-muted-foreground">Lote:</span>
                                <div className="text-admin-table-text font-medium">
                                  {attempt.auction_item?.name || 'Lote desconhecido'}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-sm bg-gray-900/50 p-3 rounded">
                              <div>
                                <span className="text-admin-muted-foreground">Lance tentado:</span>
                                <div className="text-red-400 font-bold">
                                  {formatCurrency(attempt.attempted_bid_value)}
                                </div>
                              </div>
                              <div>
                                <span className="text-admin-muted-foreground">Limite do cliente:</span>
                                <div className="text-admin-table-text font-semibold">
                                  {formatCurrency(attempt.current_limit)}
                                </div>
                              </div>
                              <div>
                                <span className="text-admin-muted-foreground">Total em lances:</span>
                                <div className="text-yellow-400 font-semibold">
                                  {formatCurrency(attempt.total_bids_at_attempt)}
                                </div>
                              </div>
                            </div>

                            <div className="mt-2 text-xs text-gray-500">
                              Motivo: {attempt.reason === 'limit_exceeded' ? 'Limite excedido' : attempt.reason}
                            </div>
                          </div>
                        </div>

                        <div className="text-xs text-admin-muted-foreground">
                          Tentativa em: {format(new Date(attempt.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
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
          <DialogContent className="bg-admin-content-bg border-admin-border max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-admin-table-text">Revisar Solicitação de Limite</DialogTitle>
            </DialogHeader>
            {selectedRequest && <ReviewRequestModal request={selectedRequest} onApprove={() => handleReviewRequest(true, selectedRequest.requested_limit)} onReject={() => handleReviewRequest(false)} />}
          </DialogContent>
        </Dialog>

        {/* Dialog para editar limite mínimo */}
        <Dialog open={minLimitDialogOpen} onOpenChange={setMinLimitDialogOpen}>
          <DialogContent className="bg-admin-content-bg border-admin-border max-w-md">
            <DialogHeader>
              <DialogTitle className="text-admin-table-text">Editar Limite Mínimo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-admin-table-text">Limite Mínimo Global</Label>
                <Input
                  type="number"
                  min={100}
                  step={100}
                  value={newMinLimit}
                  onChange={(e) => setNewMinLimit(parseInt(e.target.value) || 0)}
                  className="bg-admin-content-bg border-admin-border text-admin-table-text"
                />
                <p className="text-xs text-admin-muted-foreground mt-2">
                  Este será o valor mínimo que pode ser configurado para qualquer cliente. 
                  Nenhum cliente poderá ter um limite menor que este valor.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setMinLimitDialogOpen(false)}
                  className="text-admin-table-text border-admin-border"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleUpdateMinLimit}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default LimitesClientes;