import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Search, Edit, Check, X, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import DataTablePagination from '@/components/admin/DataTablePagination';
import BidDetailsModal from '@/components/admin/BidDetailsModal';

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
  auction_name?: string;
  user_name?: string;
  lot_name?: string;
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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [winnerFilter, setWinnerFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBids();
  }, [currentPage, pageSize, searchTerm, statusFilter, winnerFilter]);

  const fetchBids = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('bids')
        .select(`
          *,
          auctions!auction_id(name),
          profiles!user_id(name),
          auction_items!auction_item_id(name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply search filter - search across multiple fields
      if (searchTerm) {
        query = query.or(`
          id.ilike.%${searchTerm}%,
          auctions.name.ilike.%${searchTerm}%,
          profiles.name.ilike.%${searchTerm}%
        `);
      }

      // Apply status filter
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Apply winner filter
      if (winnerFilter === 'winner') {
        query = query.eq('is_winner', true);
      } else if (winnerFilter === 'not_winner') {
        query = query.eq('is_winner', false);
      }

      const { data, error, count } = await query
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);
      
      if (error) throw error;
      
      const bidsWithNames = (data || []).map(bid => ({
        ...bid,
        auction_name: bid.auctions?.name,
        user_name: bid.profiles?.name,
        lot_name: bid.auction_items?.name
      }));
      
      setBids(bidsWithNames as Bid[]);
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
    setSelectedBid(bid);
    setDetailsModalOpen(true);
  };

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bids')
        .update({ 
          status: 'approved',
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Lance aprovado com sucesso"
      });
      
      fetchBids();
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível aprovar o lance",
        variant: "destructive"
      });
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Motivo da rejeição (opcional):');
    
    try {
      const { error } = await supabase
        .from('bids')
        .update({ 
          status: 'rejected',
          client_notes: reason || 'Lance rejeitado',
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Lance rejeitado"
      });
      
      fetchBids();
    } catch (error) {
      console.error('Erro ao rejeitar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar o lance",
        variant: "destructive"
      });
    }
  };

  const handleSetWinner = async (bidId: string) => {
    if (!confirm('Tem certeza que deseja marcar este lance como vencedor?')) return;
    
    try {
      const { error } = await supabase.rpc('set_bid_winner', { 
        p_bid_id: bidId 
      });
      
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Lance marcado como vencedor"
      });

      // Ask if user wants to start next lot
      const shouldStartNext = confirm('Deseja iniciar o próximo lote automaticamente?');
      if (shouldStartNext) {
        // Find current bid to get auction_item_id
        const currentBid = bids.find(bid => bid.id === bidId);
        if (currentBid) {
          // Get auction items to find next lot
          const { data: items } = await supabase
            .from('auction_items')
            .select('*')
            .eq('auction_id', currentBid.auction_id)
            .order('order_index');

          if (items && items.length > 0) {
            const currentItemIndex = items.findIndex(item => item.id === currentBid.auction_item_id);
            const nextItem = items[currentItemIndex + 1];
            
            if (nextItem) {
              // Update current item to finished
              await supabase
                .from('auction_items')
                .update({ status: 'finished', is_current: false })
                .eq('id', currentBid.auction_item_id);
              
              // Update next item to in_progress
              await supabase
                .from('auction_items')
                .update({ status: 'in_progress', is_current: true })
                .eq('id', nextItem.id);
                
              toast({
                title: "Sucesso",
                description: `Próximo lote "${nextItem.name}" foi iniciado`
              });
            } else {
              toast({
                title: "Informação",
                description: "Não há mais lotes para iniciar"
              });
            }
          }
        }
      }
      
      fetchBids();
    } catch (error) {
      console.error('Erro ao marcar como vencedor:', error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar o lance como vencedor",
        variant: "destructive"
      });
    }
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

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleWinnerFilterChange = (value: string) => {
    setWinnerFilter(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setWinnerFilter('all');
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
        {/* Search and Filters */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por ID, leilão ou usuário..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10 bg-admin-content-bg border-admin-border text-admin-table-text"
              />
            </div>
            
            {/* Status Filter */}
            <div className="w-full lg:w-48">
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="bg-admin-content-bg border-admin-border text-admin-table-text">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-admin-card border-admin-border">
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                  <SelectItem value="superseded">Superado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Winner Filter */}
            <div className="w-full lg:w-48">
              <Select value={winnerFilter} onValueChange={handleWinnerFilterChange}>
                <SelectTrigger className="bg-admin-content-bg border-admin-border text-admin-table-text">
                  <SelectValue placeholder="Vencedor" />
                </SelectTrigger>
                <SelectContent className="bg-admin-card border-admin-border">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="winner">Apenas Vencedores</SelectItem>
                  <SelectItem value="not_winner">Não Vencedores</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="border-admin-border text-admin-table-text hover:bg-admin-hover"
            >
              Limpar Filtros
            </Button>
          </div>
        </div>

        {/* Bids Table */}
        <Card className="bg-admin-card border-admin-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-admin-border">
                  <TableHead className="text-admin-muted-foreground">ID do Lance</TableHead>
                  <TableHead className="text-admin-muted-foreground">Leilão</TableHead>
                  <TableHead className="text-admin-muted-foreground">Lote</TableHead>
                  <TableHead className="text-admin-muted-foreground">Usuário</TableHead>
                  <TableHead className="text-admin-muted-foreground">Valor</TableHead>
                  <TableHead className="text-admin-muted-foreground">Status</TableHead>
                  <TableHead className="text-admin-muted-foreground">Vencedor</TableHead>
                  <TableHead className="text-admin-muted-foreground">Data</TableHead>
                  <TableHead className="text-admin-muted-foreground">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bids.map(bid => (
                  <TableRow key={bid.id} className="border-admin-border">
                    <TableCell className="text-admin-table-text">{bid.id.slice(0, 8)}...</TableCell>
                    <TableCell className="text-admin-table-text">{bid.auction_name || '-'}</TableCell>
                    <TableCell className="text-admin-table-text">{bid.lot_name || '-'}</TableCell>
                    <TableCell className="text-admin-table-text">{bid.user_name || '-'}</TableCell>
                    <TableCell className="text-admin-table-text">R$ {bid.bid_value}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(bid.status)}>
                        {getStatusDisplay(bid.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {bid.is_winner ? (
                        <Badge variant="admin-success" className="bg-yellow-500 text-black">
                          <Trophy className="h-3 w-3 mr-1" />
                          Vencedor
                        </Badge>
                      ) : (
                        <span className="text-admin-muted-foreground text-sm">-</span>
                      )}
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
                          className="text-blue-400 hover:text-blue-300 hover:bg-gray-800"
                          title="Visualizar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {bid.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleApprove(bid.id)}
                              className="text-green-400 hover:text-green-300 hover:bg-gray-800"
                              title="Aprovar"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleReject(bid.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-gray-800"
                              title="Rejeitar"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {bid.status === 'approved' && !bid.is_winner && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleSetWinner(bid.id)}
                            className="text-yellow-400 hover:text-yellow-300 hover:bg-gray-800"
                            title="Marcar como Vencedor"
                          >
                            <Trophy className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleDelete(bid.id)}
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

        {bids.length === 0 && (
          <Card className="bg-admin-card border-admin-border mt-6">
            <CardContent className="p-12 text-center">
              <p className="text-admin-muted-foreground">Nenhum lance encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>

      <BidDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        bid={selectedBid}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </>
  );
};

export default AdminBids;
