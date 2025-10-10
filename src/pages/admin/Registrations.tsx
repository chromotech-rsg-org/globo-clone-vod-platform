import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, X, Search, Eye, Power, UserX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import DataTablePagination from '@/components/admin/DataTablePagination';
import RegistrationDetailsModal from '@/components/admin/RegistrationDetailsModal';
import BulkActionsToolbar from '@/components/admin/BulkActionsToolbar';

interface Registration {
  id: string;
  user_id: string;
  auction_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  client_notes?: string;
  internal_notes?: string;
  approved_by?: string;
  auction_name?: string;
  user_name?: string;
}

const getStatusDisplay = (status: string) => {
  const statusMap: { [key: string]: string } = {
    'pending': 'Pendente',
    'approved': 'Aprovado',
    'rejected': 'Rejeitado',
    'canceled': 'Cancelado',
    'reopened': 'Reaberto',
    'disabled': 'Desabilitado'
  };
  return statusMap[status] || status;
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'approved':
      return 'admin-success';
    case 'rejected':
    case 'canceled':
    case 'disabled':
      return 'admin-danger';
    case 'pending':
    case 'reopened':
      return 'secondary';
    default:
      return 'outline';
  }
};

const AdminRegistrations = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchRegistrations();
  }, [statusFilter, currentPage, pageSize, searchTerm]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('auction_registrations')
        .select(`
          *,
          auctions!auction_id(name),
          profiles!user_id(name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (searchTerm) {
        query = query.or(`id.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await query
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      if (error) throw error;
      
      const registrationsWithNames = (data || []).map(registration => ({
        ...registration,
        auction_name: registration.auctions?.name,
        user_name: registration.profiles?.name
      }));
      
      setRegistrations(registrationsWithNames as Registration[]);
      setTotalItems(count || 0);
    } catch (error) {
      console.error('Erro ao buscar habilitações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as habilitações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      // Buscar registro para obter user_id
      const { data: registration, error: fetchError } = await supabase
        .from('auction_registrations')
        .select('user_id')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('auction_registrations')
        .update({ 
          status: 'approved',
          client_notes: 'Aprovado',
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;

      // Verificar se o usuário tem assinatura ativa
      if (registration) {
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('plan_id')
          .eq('user_id', registration.user_id)
          .eq('status', 'active')
          .single();

        // Se tem plano ativo, aplicar na MOTV
        if (subscription?.plan_id) {
          try {
            const { MotvPlanManager } = await import('@/services/motvPlanManager');
            await MotvPlanManager.changePlan(registration.user_id, subscription.plan_id);
            console.log('Plano aplicado na MOTV após aprovação de registro');
          } catch (motvError) {
            console.error('Erro ao aplicar plano na MOTV:', motvError);
            // Não falhar a aprovação por erro na MOTV
          }
        }
      }
      
      toast({
        title: "Sucesso",
        description: "Habilitação aprovada com sucesso"
      });
      
      fetchRegistrations();
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível aprovar a habilitação",
        variant: "destructive"
      });
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Motivo da rejeição (opcional):');
    
    try {
      const { error } = await supabase
        .from('auction_registrations')
        .update({ 
          status: 'rejected',
          client_notes: reason || 'Habilitação rejeitada',
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Habilitação rejeitada"
      });
      
      fetchRegistrations();
    } catch (error) {
      console.error('Erro ao rejeitar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar a habilitação",
        variant: "destructive"
      });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'approved' ? 'disabled' : 'approved';
    const action = newStatus === 'approved' ? 'ativada' : 'desabilitada';
    
    try {
      const currentUser = (await supabase.auth.getUser()).data.user?.id;
      
      const updateData: any = { 
        status: newStatus,
        approved_by: currentUser,
        updated_at: new Date().toISOString()
      };
      
      // If disabling, mark it as manual deactivation
      if (newStatus === 'disabled') {
        updateData.manually_disabled_by = currentUser;
        updateData.manually_disabled_at = new Date().toISOString();
      } else if (newStatus === 'approved') {
        // Clear manual deactivation fields when re-approving
        updateData.manually_disabled_by = null;
        updateData.manually_disabled_at = null;
      }

      const { error } = await supabase
        .from('auction_registrations')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: `Habilitação ${action} com sucesso`
      });
      
      fetchRegistrations();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status da habilitação",
        variant: "destructive"
      });
    }
  };

  const handleViewDetails = (registration: Registration) => {
    setSelectedRegistration(registration);
    setDetailsModalOpen(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(registrations.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    }
  };

  const handleBulkApprove = async (ids: string[]) => {
    if (!confirm(`Tem certeza que deseja aprovar ${ids.length} habilitação(ões)?`)) return;
    
    try {
      const currentUser = (await supabase.auth.getUser()).data.user?.id;
      
      const { error } = await supabase
        .from('auction_registrations')
        .update({ 
          status: 'approved',
          client_notes: 'Aprovado em massa',
          approved_by: currentUser,
          updated_at: new Date().toISOString()
        })
        .in('id', ids);
        
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: `${ids.length} habilitação(ões) aprovada(s) com sucesso`
      });
      
      setSelectedIds([]);
      fetchRegistrations();
    } catch (error) {
      console.error('Erro ao aprovar em massa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível aprovar as habilitações selecionadas",
        variant: "destructive"
      });
    }
  };

  const handleBulkReject = async (ids: string[]) => {
    if (!confirm(`Tem certeza que deseja rejeitar ${ids.length} habilitação(ões)?`)) return;
    
    try {
      const currentUser = (await supabase.auth.getUser()).data.user?.id;
      
      const { error } = await supabase
        .from('auction_registrations')
        .update({ 
          status: 'rejected',
          client_notes: 'Rejeitado em massa',
          approved_by: currentUser,
          updated_at: new Date().toISOString()
        })
        .in('id', ids);
        
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: `${ids.length} habilitação(ões) rejeitada(s)`
      });
      
      setSelectedIds([]);
      fetchRegistrations();
    } catch (error) {
      console.error('Erro ao rejeitar em massa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar as habilitações selecionadas",
        variant: "destructive"
      });
    }
  };

  const handleBulkDisable = async (ids: string[]) => {
    if (!confirm(`Tem certeza que deseja desabilitar ${ids.length} habilitação(ões)?`)) return;
    
    try {
      const currentUser = (await supabase.auth.getUser()).data.user?.id;
      
      const { error } = await supabase
        .from('auction_registrations')
        .update({ 
          status: 'disabled',
          approved_by: currentUser,
          manually_disabled_by: currentUser,
          manually_disabled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .in('id', ids);
        
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: `${ids.length} habilitação(ões) desabilitada(s) com sucesso`
      });
      
      setSelectedIds([]);
      fetchRegistrations();
    } catch (error) {
      console.error('Erro ao desabilitar em massa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível desabilitar as habilitações selecionadas",
        variant: "destructive"
      });
    }
  };

  const totalPages = Math.ceil(totalItems / pageSize);
  const allSelected = registrations.length > 0 && selectedIds.length === registrations.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < registrations.length;

  if (loading) {
    return <div className="p-6">
      <div className="text-admin-table-text">Carregando...</div>
    </div>;
  }

  return (
    <>
      <header className="bg-admin-header border-b border-admin-border">
        <div className="px-6 py-4">
          <h1 className="text-xl font-bold text-admin-sidebar-text">Gerenciar Habilitações</h1>
        </div>
      </header>

      <div className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar habilitações..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 bg-admin-content-bg border-admin-border text-admin-table-text"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-admin-content-bg border border-admin-border text-admin-table-text rounded text-sm min-w-[140px]"
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Pendente</option>
            <option value="approved">Aprovado</option>
            <option value="rejected">Rejeitado</option>
            <option value="canceled">Cancelado</option>
            <option value="reopened">Reaberto</option>
            <option value="disabled">Desabilitado</option>
          </select>
        </div>

        <BulkActionsToolbar
          selectedIds={selectedIds}
          totalSelected={selectedIds.length}
          onClearSelection={() => setSelectedIds([])}
          table="auction_registrations"
          customActions={[
            {
              key: 'approve',
              label: 'Aprovar Selecionados',
              icon: Check,
              variant: 'default',
              action: handleBulkApprove
            },
            {
              key: 'reject',
              label: 'Rejeitar Selecionados',
              icon: X,
              variant: 'destructive',
              action: handleBulkReject
            },
            {
              key: 'disable',
              label: 'Desabilitar Selecionados',
              icon: UserX,
              variant: 'destructive',
              action: handleBulkDisable
            }
          ]}
          exportColumns={['id', 'user_id', 'auction_id', 'status', 'created_at']}
          exportFileName="habilitacoes"
        />

        {/* Registrations Table */}
        <Card className="bg-admin-card border-admin-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-admin-border">
                  <TableHead className="text-admin-muted-foreground w-12">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Selecionar todos"
                    />
                  </TableHead>
                  <TableHead className="text-admin-muted-foreground">ID da Habilitação</TableHead>
                  <TableHead className="text-admin-muted-foreground">Usuário</TableHead>
                  <TableHead className="text-admin-muted-foreground">Leilão</TableHead>
                  <TableHead className="text-admin-muted-foreground">Status</TableHead>
                  <TableHead className="text-admin-muted-foreground">Data</TableHead>
                  <TableHead className="text-admin-muted-foreground">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map(registration => (
                  <TableRow key={registration.id} className="border-admin-border">
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(registration.id)}
                        onCheckedChange={(checked) => handleSelectOne(registration.id, checked as boolean)}
                        aria-label={`Selecionar ${registration.id}`}
                      />
                    </TableCell>
                    <TableCell className="text-admin-table-text">{registration.id.slice(0, 8)}...</TableCell>
                    <TableCell className="text-admin-table-text">{registration.user_name || '-'}</TableCell>
                    <TableCell className="text-admin-table-text">{registration.auction_name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(registration.status)}>
                        {getStatusDisplay(registration.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-admin-table-text">
                      {new Date(registration.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleViewDetails(registration)}
                          className="text-blue-400 hover:text-blue-300 hover:bg-gray-800"
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {registration.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleApprove(registration.id)}
                              className="text-green-400 hover:text-green-300 hover:bg-gray-800"
                              title="Aprovar"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleReject(registration.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-gray-800"
                              title="Rejeitar"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {(registration.status === 'approved' || registration.status === 'disabled') && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleToggleStatus(registration.id, registration.status)}
                            className={registration.status === 'approved' 
                              ? "text-green-400 hover:text-green-300 hover:bg-gray-800" 
                              : "text-red-400 hover:text-red-300 hover:bg-gray-800"}
                            title={registration.status === 'approved' ? 'Desabilitar' : 'Ativar'}
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {totalItems > 0 && (
              <DataTablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            )}
          </CardContent>
        </Card>

        {registrations.length === 0 && (
          <Card className="bg-admin-card border-admin-border mt-6">
            <CardContent className="p-12 text-center">
              <p className="text-admin-muted-foreground">Nenhuma habilitação encontrada</p>
            </CardContent>
          </Card>
        )}
      </div>

      <RegistrationDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        registration={selectedRegistration}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </>
  );
};

export default AdminRegistrations;
