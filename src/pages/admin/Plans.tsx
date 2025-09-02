import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Plus, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import DataTablePagination from '@/components/admin/DataTablePagination';
import PlanFormDialog from '@/components/admin/PlanFormDialog';

interface Plan {
  id: string;
  name: string;
  price: number;
  billing_cycle: string;
  payment_type: string;
  active: boolean;
  best_seller: boolean;
  priority: number;
  free_days: number;
  description?: string;
  benefits?: string[];
  created_at: string;
  updated_at: string;
}

const AdminPlans = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | undefined>();
  const { toast } = useToast();

  useEffect(() => {
    fetchPlans();
  }, [statusFilter, currentPage, pageSize, searchTerm]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('plans')
        .select('*', { count: 'exact' })
        .order('priority', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('active', statusFilter === 'active');
      }

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, error, count } = await query
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      setPlans(data as Plan[] || []);
      setTotalItems(count || 0);
    } catch (error: any) {
      console.error('Erro ao buscar planos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os planos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este plano?')) return;
    try {
      const { error } = await supabase.from('plans').delete().eq('id', id);
      if (error) throw error;
      toast({
        title: "Sucesso",
        description: "Plano excluído com sucesso"
      });
      fetchPlans();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o plano",
        variant: "destructive"
      });
    }
  };

  const handleCreate = () => {
    setEditingPlan(undefined);
    setDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    fetchPlans();
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
          <h1 className="text-xl font-bold text-white">Gerenciar Planos</h1>
        </div>
      </header>

      <div className="p-6">
        {/* Search and Create */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar planos..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 bg-black border-green-600/30 text-white"
            />
          </div>
          <Button onClick={handleCreate} variant="admin">
            <Plus className="h-4 w-4 mr-2" />
            Novo Plano
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
          </select>
        </div>

        {/* Plans Table */}
        <Card className="bg-black border-green-600/30">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Nome</TableHead>
                  <TableHead className="text-gray-300">Preço</TableHead>
                  <TableHead className="text-gray-300">Ciclo</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map(plan => (
                  <TableRow key={plan.id} className="border-gray-700">
                    <TableCell className="text-white">
                      <div className="flex items-center gap-2">
                        {plan.name}
                        {plan.best_seller && (
                          <Badge variant="admin-success" className="text-xs">
                            Mais Vendido
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-white">
                      R$ {plan.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-white">
                      {plan.billing_cycle === 'monthly' ? 'Mensal' : 
                       plan.billing_cycle === 'yearly' ? 'Anual' : plan.billing_cycle}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        plan.active ? 'admin-success' : 'admin-muted'
                      }>
                        {plan.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleEdit(plan)}
                          className="text-gray-400 hover:text-white hover:bg-gray-800"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleDelete(plan.id)}
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

        {plans.length === 0 && (
          <Card className="bg-black border-green-600/30 mt-6">
            <CardContent className="p-12 text-center">
              <p className="text-gray-400">Nenhum plano encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>

      <PlanFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        plan={editingPlan}
        onSuccess={handleDialogSuccess}
      />
    </>
  );
};

export default AdminPlans;
