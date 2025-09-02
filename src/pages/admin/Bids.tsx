
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Search, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import DataTablePagination from '@/components/admin/DataTablePagination';

interface Bid {
  id: string;
  auction_id: string;
  user_id: string;
  auction_item_id: string;
  bid_value: number;
  status: string;
  created_at: string;
  updated_at: string;
  approved_by?: string;
  is_winner: boolean;
  internal_notes?: string;
  client_notes?: string;
}

const getStatusDisplay = (status: string) => {
  const statusMap: { [key: string]: string } = {
    'pending': 'Pendente',
    'approved': 'Aprovado',
    'rejected': 'Rejeitado',
    'superseded': 'Superado'
  };
  return statusMap[status] || status;
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'approved':
      return 'admin-success';
    case 'rejected':
      return 'admin-danger';
    case 'pending':
      return 'secondary';
    default:
      return 'outline';
  }
};

const AdminBids = () => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5); // Mudança aqui: padrão 5 linhas
  const [totalItems, setTotalItems] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchBids();
  }, [currentPage, pageSize, searchTerm]);

  const fetchBids = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('bids')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`id.ilike.%${searchTerm}%,user_id.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await query
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);
      
      if (error) throw error;
      setBids(data as Bid[] || []);
      setTotalItems(count || 0);
    } catch (error) {
      console.error('Erro ao buscar lances:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os lances",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este lance?')) return;
    try {
      const { error } = await supabase
        .from('bids')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({
        title: "Sucesso",
        description: "Lance excluído com sucesso",
      });
      fetchBids();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o lance",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (bid: Bid) => {
    console.log('Visualizar detalhes do lance:', bid);
    toast({
      title: "Detalhes",
      description: `Visualizando detalhes do lance ${bid.id}`,
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

  return (
    <>
      <header className="bg-admin-header border-b border-admin-border">
        <div className="px-6 py-4">
          <h1 className="text-xl font-bold text-admin-sidebar-text">Gerenciar Lances</h1>
        </div>
      </header>

      <div className="p-6">
        {/* Search */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar lances..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 bg-admin-content-bg border-admin-border text-admin-table-text"
            />
          </div>
        </div>

        {/* Bids Table */}
        <Card className="bg-admin-card border-admin-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-admin-border">
                  <TableHead className="text-admin-muted-foreground">ID</TableHead>
                  <TableHead className="text-admin-muted-foreground">Leilão ID</TableHead>
                  <TableHead className="text-admin-muted-foreground">Usuário ID</TableHead>
                  <TableHead className="text-admin-muted-foreground">Valor</TableHead>
                  <TableHead className="text-admin-muted-foreground">Status</TableHead>
                  <TableHead className="text-admin-muted-foreground">Data</TableHead>
                  <TableHead className="text-admin-muted-foreground">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bids.map(bid => (
                  <TableRow key={bid.id} className="border-admin-border">
                    <TableCell className="text-admin-table-text">{bid.id.slice(0, 8)}...</TableCell>
                    <TableCell className="text-admin-table-text">{bid.auction_id.slice(0, 8)}...</TableCell>
                    <TableCell className="text-admin-table-text">{bid.user_id.slice(0, 8)}...</TableCell>
                    <TableCell className="text-admin-table-text">R$ {bid.bid_value}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(bid.status)}>
                        {getStatusDisplay(bid.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-admin-table-text">
                      {new Date(bid.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleViewDetails(bid)}
                          className="text-gray-400 hover:text-white hover:bg-gray-800"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleDelete(bid.id)}
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

        {bids.length === 0 && (
          <Card className="bg-admin-card border-admin-border mt-6">
            <CardContent className="p-12 text-center">
              <p className="text-admin-muted-foreground">Nenhum lance encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default AdminBids;
