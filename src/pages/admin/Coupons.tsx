
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

interface Coupon {
  id: string;
  name: string;
  code: string;
  discount_percentage: number;
  active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchCoupons();
  }, [currentPage, pageSize, searchTerm]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('coupons')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await query
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);
      
      if (error) throw error;
      setCoupons(data as Coupon[] || []);
      setTotalItems(count || 0);
    } catch (error) {
      console.error('Erro ao buscar cupons:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os cupons",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (coupon: Coupon) => {
    console.log('Editar cupom:', coupon);
    toast({
      title: "Editar",
      description: `Editando cupom ${coupon.code}`,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cupom?')) return;
    
    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Cupom excluído com sucesso"
      });
      
      fetchCoupons();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o cupom",
        variant: "destructive"
      });
    }
  };

  const handleCreate = () => {
    console.log('Criar novo cupom');
    toast({
      title: "Criar",
      description: "Abrindo formulário para criar novo cupom",
    });
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
      <header className="bg-admin-header border-b border-admin-border">
        <div className="px-6 py-4">
          <h1 className="text-xl font-bold text-admin-sidebar-text">Gerenciar Cupons</h1>
        </div>
      </header>

      <div className="p-6">
        {/* Search and Create */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar cupons..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 bg-admin-content-bg border-admin-border text-admin-table-text"
            />
          </div>
          <Button onClick={handleCreate} variant="admin">
            <Plus className="h-4 w-4 mr-2" />
            Novo Cupom
          </Button>
        </div>

        {/* Coupons Table */}
        <Card className="bg-admin-card border-admin-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-admin-border">
                  <TableHead className="text-admin-muted-foreground">Nome</TableHead>
                  <TableHead className="text-admin-muted-foreground">Código</TableHead>
                  <TableHead className="text-admin-muted-foreground">Desconto (%)</TableHead>
                  <TableHead className="text-admin-muted-foreground">Status</TableHead>
                  <TableHead className="text-admin-muted-foreground">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map(coupon => (
                  <TableRow key={coupon.id} className="border-admin-border">
                    <TableCell className="text-admin-table-text">{coupon.name}</TableCell>
                    <TableCell className="text-admin-table-text font-mono">{coupon.code}</TableCell>
                    <TableCell className="text-admin-table-text">{coupon.discount_percentage}%</TableCell>
                    <TableCell>
                      <Badge variant={coupon.active ? 'admin-success' : 'admin-muted'}>
                        {coupon.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleEdit(coupon)}
                          className="text-gray-400 hover:text-white hover:bg-gray-800"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleDelete(coupon.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-gray-800"
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

        {coupons.length === 0 && (
          <Card className="bg-admin-card border-admin-border mt-6">
            <CardContent className="p-12 text-center">
              <p className="text-admin-muted-foreground">Nenhum cupom encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default AdminCoupons;
