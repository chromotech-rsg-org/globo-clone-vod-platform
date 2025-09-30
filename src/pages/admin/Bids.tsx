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
import { LotProgressionModal } from '@/components/admin/LotProgressionModal';

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
  const [progressionModal, setProgressionModal] = useState<{
    open: boolean;
    winningBid?: any;
    currentLot?: any;
    nextLot?: any;
    hasNextLot: boolean;
  }>({
    open: false,
    hasNextLot: false
  });
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

      // Apply search filter - search by bid ID
      if (searchTerm) {
        query = query.ilike('id', `%${searchTerm}%`);
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

  // Função removida - lances são aprovados automaticamente

  // Função removida - lances são aprovados automaticamente

  const handleSetWinner = async (bidId: string) => {
    if (!confirm('Tem certeza que deseja marcar este lance como vencedor e finalizar o lote?')) return;
    
    try {
      console.log('Setting winner for bid:', bidId);
      
      // Call the edge function to set winner and finalize lot
      const { data, error } = await supabase.functions.invoke('manage-lot-progression', {
        body: {
          action: 'set_winner_and_finalize',
          bidId: bidId
        }
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Erro na função de gerenciamento de lotes');
      }

      if (!data) {
        throw new Error('Resposta vazia da função de gerenciamento');
      }

      const result = data;
      
      // Find the winning bid to get details
      const winningBid = bids.find(b => b.id === bidId);
      
      if (!winningBid) {
        console.error('Winning bid not found in current bids');
        throw new Error('Lance vencedor não encontrado');
      }

      console.log('Winner set successfully:', result);
      
      toast({
        title: "Sucesso",
        description: "Lance marcado como vencedor e lote finalizado!"
      });
      
      // Show progression modal if there's a next lot
      if (result.next_lot_available) {
        setProgressionModal({
          open: true,
          winningBid,
          currentLot: { name: winningBid?.lot_name || 'Lote atual' },
          nextLot: {
            id: result.next_lot_id,
            name: result.next_lot_name
          },
          hasNextLot: true
        });
      } else {
        // All lots finished
        setProgressionModal({
          open: true,
          winningBid,
          currentLot: { name: winningBid?.lot_name || 'Lote atual' },
          hasNextLot: false
        });
      }
      
      fetchBids();
    } catch (error) {
      console.error('Error setting winner:', error);
      const errorMessage = error instanceof Error ? error.message : 'Não foi possível marcar o lance como vencedor';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleStartNextLot = async () => {
    try {
      const { nextLot } = progressionModal;
      if (!nextLot?.id) return;

      const { error } = await supabase.functions.invoke('manage-lot-progression', {
        body: {
          action: 'start_next_lot',
          auctionId: bids[0]?.auction_id, // Get auction ID from current bids
          lotId: nextLot.id
        }
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Lote "${nextLot.name}" iniciado com sucesso!`
      });
      
      setProgressionModal({ ...progressionModal, open: false });
      fetchBids();
    } catch (error) {
      console.error('Error starting next lot:', error);
      toast({
        title: "Erro",
        description: "Erro ao iniciar próximo lote.",
        variant: "destructive"
      });
    }
  };

  const handleSkipNextLot = () => {
    setProgressionModal({ ...progressionModal, open: false });
    toast({
      title: "Informação",
      description: "Próximo lote não foi iniciado."
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
                        {/* Ações de aprovação removidas - lances são aprovados automaticamente */}
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
        />

      <LotProgressionModal
        open={progressionModal.open}
        onOpenChange={(open) => setProgressionModal({ ...progressionModal, open })}
        winningBid={progressionModal.winningBid}
        currentLot={progressionModal.currentLot}
        nextLot={progressionModal.nextLot}
        hasNextLot={progressionModal.hasNextLot}
        onStartNextLot={handleStartNextLot}
        onSkipNextLot={handleSkipNextLot}
      />
    </>
  );
};

export default AdminBids;
