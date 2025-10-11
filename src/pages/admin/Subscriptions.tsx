
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Edit, Trash2, Plus, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import DataTablePagination from '@/components/admin/DataTablePagination';
import SubscriptionFormDialog from '@/components/admin/SubscriptionFormDialog';

interface Subscription {
  id: string;
  user_id: string;
  plan_id?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    name: string;
    email: string;
  };
  plans?: {
    name: string;
  };
}

const AdminSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | undefined>();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscriptions();
  }, [statusFilter, currentPage, pageSize, searchTerm]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('subscriptions')
        .select(`
          *,
          profiles(name, email),
          plans(name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (searchTerm) {
        query = query.or(`profiles.name.ilike.%${searchTerm}%,profiles.email.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await query
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      setSubscriptions(data as Subscription[] || []);
      setTotalItems(count || 0);
    } catch (error: any) {
      console.error('Erro ao buscar assinaturas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as assinaturas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setSubscriptionToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!subscriptionToDelete) return;
    
    try {
      // Get subscription details
      const { data: subscription, error: fetchError } = await supabase
        .from('subscriptions')
        .select('user_id, profiles(name)')
        .eq('id', subscriptionToDelete)
        .single();

      if (fetchError) throw fetchError;

      // Delete from database
      const { error } = await supabase.from('subscriptions').delete().eq('id', subscriptionToDelete);
      if (error) throw error;

      // Apply suspension plan or cancel in MOTV
      try {
        console.log('🔄 Applying suspension/cancellation in MOTV for user:', subscription.user_id);
        
        // Check if suspension package exists
        const { data: suspensionPackage } = await supabase
          .from('packages')
          .select('id, code')
          .eq('suspension_package', true)
          .eq('active', true)
          .maybeSingle();

        await supabase.functions.invoke('manage-subscription-motv', {
          body: {
            userId: subscription.user_id,
            action: suspensionPackage ? 'cancel' : 'cancel', // Will apply suspension if exists, or cancel
            suspensionPackageCode: suspensionPackage?.code
          }
        });

        console.log('✅ MOTV plan updated successfully');
      } catch (motvError) {
        console.error('⚠️ Error updating MOTV:', motvError);
        // Don't fail the deletion if MOTV update fails
      }
      
      toast({
        title: "Sucesso",
        description: "Assinatura excluída com sucesso"
      });
      fetchSubscriptions();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a assinatura",
        variant: "destructive"
      });
    } finally {
      setDeleteConfirmOpen(false);
      setSubscriptionToDelete(null);
    }
  };

  const handleCreate = () => {
    setEditingSubscription(undefined);
    setDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    fetchSubscriptions();
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

  const totalPages = Math.ceil(totalItems / pageSize);

  if (loading) {
    return <div className="p-6">
      <div className="text-white">Carregando...</div>
    </div>;
  }

  return (
    <>
      <header className="bg-black border-b border-green-600/30">
        <div className="px-6 py-4">
          <h1 className="text-xl font-bold text-white">Gerenciar Assinaturas</h1>
        </div>
      </header>

      <div className="p-6">
        {/* Search and Create */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar assinaturas..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 bg-black border-green-600/30 text-white"
            />
          </div>
          <Button onClick={handleCreate} variant="admin">
            <Plus className="h-4 w-4 mr-2" />
            Nova Assinatura
          </Button>
        </div>

        <div className="flex gap-4 mb-6">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-black border border-green-600/30 text-white rounded"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
            <option value="canceled">Cancelado</option>
            <option value="expired">Expirado</option>
          </select>
        </div>

        {/* Subscriptions Table */}
        <Card className="bg-black border-green-600/30">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Usuário</TableHead>
                  <TableHead className="text-gray-300">Plano</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Data de Início</TableHead>
                  <TableHead className="text-gray-300">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map(subscription => (
                  <TableRow key={subscription.id} className="border-gray-700">
                    <TableCell className="text-white">
                      <div>
                        <div>{subscription.profiles?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-400">{subscription.profiles?.email || 'N/A'}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-white">
                      {subscription.plans?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        subscription.status === 'active' ? 'admin-success' :
                        subscription.status === 'canceled' ? 'admin-danger' :
                        subscription.status === 'expired' ? 'admin-muted' :
                          'admin-muted'
                      }>
                        {subscription.status === 'active' ? 'Ativo' :
                         subscription.status === 'canceled' ? 'Cancelado' :
                         subscription.status === 'expired' ? 'Expirado' :
                         subscription.status === 'inactive' ? 'Inativo' : subscription.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white">
                      {subscription.start_date ? new Date(subscription.start_date).toLocaleDateString('pt-BR') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleEdit(subscription)}
                          className="text-gray-400 hover:text-white hover:bg-gray-800"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                         <Button 
                           size="sm" 
                           variant="ghost" 
                           onClick={() => handleDeleteClick(subscription.id)}
                           className="text-red-400 hover:text-red-300 hover:bg-gray-800"
                           title="Excluir"
                         >
                           <Trash2 className="h-4 w-4" />
                         </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* Always show pagination controls */}
            <DataTablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </CardContent>
        </Card>

        {subscriptions.length === 0 && (
          <Card className="bg-black border-green-600/30 mt-6">
            <CardContent className="p-12 text-center">
              <p className="text-gray-400">Nenhuma assinatura encontrada</p>
            </CardContent>
          </Card>
        )}
      </div>

      <SubscriptionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        subscription={editingSubscription}
        onSuccess={handleDialogSuccess}
      />

      {/* Delete Confirmation Modal */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="bg-black border-admin-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-admin-muted-foreground">
              Tem certeza que deseja excluir esta assinatura? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-admin-card border-admin-border text-admin-foreground hover:bg-white hover:text-black"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setSubscriptionToDelete(null);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={handleDeleteConfirm}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminSubscriptions;
