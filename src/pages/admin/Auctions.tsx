import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash2, Plus, Search, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Auction } from '@/types/auction';
import DataTablePagination from '@/components/admin/DataTablePagination';
import AuctionEditModal from '@/components/admin/AuctionEditModal';
import AuctionCreateModal from '@/components/admin/AuctionCreateModal';
import BulkActionsToolbar from '@/components/admin/BulkActionsToolbar';

const AdminAuctions = () => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [auctionLotCounts, setAuctionLotCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [liveFilter, setLiveFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [editingAuction, setEditingAuction] = useState<Auction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Function to remove accents for search
  const removeAccents = (str: string) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(inputValue);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [inputValue]);

  useEffect(() => {
    fetchAuctions();
  }, [statusFilter, liveFilter, currentPage, pageSize, searchTerm, activeTab]);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('auctions')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (liveFilter !== 'all') {
        query = query.eq('is_live', liveFilter === 'live');
      }

      // Filter by tab
      if (activeTab === 'pre-bidding') {
        query = query.eq('allow_pre_bidding', true);
      }

      if (searchTerm) {
        const normalizedSearch = removeAccents(searchTerm);
        query = query.or(`name.ilike.%${searchTerm}%,name.ilike.%${normalizedSearch}%`);
      }

      const { data, error, count } = await query
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      setAuctions(data as Auction[] || []);
      setTotalItems(count || 0);

      // Fetch lot counts separately
      if (data && data.length > 0) {
        const auctionIds = data.map(auction => auction.id);
        const { data: lotCounts, error: lotCountError } = await supabase
          .from('auction_items')
          .select('auction_id')
          .in('auction_id', auctionIds);

        if (!lotCountError && lotCounts) {
          const counts: Record<string, number> = {};
          lotCounts.forEach(lot => {
            counts[lot.auction_id] = (counts[lot.auction_id] || 0) + 1;
          });
          setAuctionLotCounts(counts);
        }
      }
    } catch (error: any) {
      console.error('Erro ao buscar leilões:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os leilões",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      if (inputRef.current && document.activeElement !== inputRef.current) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    }
  };

  const handleView = (item: Auction) => {
    setEditingAuction(item);
    setIsEditModalOpen(true);
  };

  const handleEdit = (item: Auction) => {
    setEditingAuction(item);
    setIsEditModalOpen(true);
  };

  const handleDuplicate = async (auction: Auction) => {
    try {
      const { id, created_at, updated_at, ...auctionData } = auction;
      
      // Create duplicate with modified name
      const duplicateData = {
        ...auctionData,
        name: `${auction.name} - Cópia`,
        status: 'inactive'
      };

      const { data: newAuction, error } = await supabase
        .from('auctions')
        .insert([duplicateData])
        .select()
        .single();

      if (error) throw error;

      // Fetch original lots
      const { data: originalLots, error: lotsError } = await supabase
        .from('auction_items')
        .select('*')
        .eq('auction_id', auction.id)
        .order('order_index', { ascending: true });

      if (lotsError) throw lotsError;

      // Duplicate lots if any exist
      if (originalLots && originalLots.length > 0) {
        const duplicateLots = originalLots.map(lot => {
          const { id, created_at, updated_at, auction_id, ...lotData } = lot;
          return {
            ...lotData,
            auction_id: newAuction.id,
            is_current: false,
            status: 'not_started'
          };
        });

        const { error: lotsInsertError } = await supabase
          .from('auction_items')
          .insert(duplicateLots);

        if (lotsInsertError) throw lotsInsertError;
      }

      toast({
        title: "Sucesso",
        description: `Leilão duplicado com ${originalLots?.length || 0} lote(s)`
      });

      fetchAuctions();
    } catch (error: any) {
      console.error('Erro ao duplicar leilão:', error);
      toast({
        title: "Erro",
        description: "Não foi possível duplicar o leilão",
        variant: "destructive"
      });
    }
  };

  const handleModalClose = () => {
    setIsEditModalOpen(false);
    setEditingAuction(null);
  };

  const handleModalSave = () => {
    fetchAuctions();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este leilão?')) return;
    try {
      const { error } = await supabase.from('auctions').delete().eq('id', id);
      if (error) throw error;
      toast({
        title: "Sucesso",
        description: "Leilão excluído com sucesso"
      });
      fetchAuctions();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o leilão",
        variant: "destructive"
      });
    }
  };

  const handleCreate = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateModalClose = () => {
    setIsCreateModalOpen(false);
  };

  const handleCreateModalSave = () => {
    fetchAuctions();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(auctions.map(a => a.id));
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

  const handleBulkDelete = async (ids: string[]) => {
    if (!confirm(`Tem certeza que deseja excluir ${ids.length} leilão(ões)?`)) return;
    
    try {
      const { error } = await supabase
        .from('auctions')
        .delete()
        .in('id', ids);
        
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: `${ids.length} leilão(ões) excluído(s) com sucesso`
      });
      
      setSelectedIds([]);
      fetchAuctions();
    } catch (error) {
      console.error('Erro ao excluir em massa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir os leilões selecionados",
        variant: "destructive"
      });
    }
  };

  const handleBulkDuplicate = async (ids: string[]) => {
    try {
      const auctionsToDuplicate = auctions.filter(a => ids.includes(a.id));
      
      let totalLotsDuplicated = 0;

      for (const auction of auctionsToDuplicate) {
        const { id, created_at, updated_at, ...auctionData } = auction;
        
        const duplicateData = {
          ...auctionData,
          name: `${auction.name} - Cópia`,
          status: 'inactive'
        };

        const { data: newAuction, error } = await supabase
          .from('auctions')
          .insert([duplicateData])
          .select()
          .single();

        if (error) throw error;

        // Fetch and duplicate lots
        const { data: originalLots, error: lotsError } = await supabase
          .from('auction_items')
          .select('*')
          .eq('auction_id', auction.id)
          .order('order_index', { ascending: true });

        if (lotsError) throw lotsError;

        if (originalLots && originalLots.length > 0) {
          const duplicateLots = originalLots.map(lot => {
            const { id, created_at, updated_at, auction_id, ...lotData } = lot;
            return {
              ...lotData,
              auction_id: newAuction.id,
              is_current: false,
              status: 'not_started'
            };
          });

          const { error: lotsInsertError } = await supabase
            .from('auction_items')
            .insert(duplicateLots);

          if (lotsInsertError) throw lotsInsertError;
          
          totalLotsDuplicated += originalLots.length;
        }
      }

      toast({
        title: "Sucesso",
        description: `${ids.length} leilão(ões) duplicado(s) com ${totalLotsDuplicated} lote(s)`
      });

      setSelectedIds([]);
      fetchAuctions();
    } catch (error: any) {
      console.error('Erro ao duplicar em massa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível duplicar os leilões selecionados",
        variant: "destructive"
      });
    }
  };

  const totalPages = Math.ceil(totalItems / pageSize);
  const allSelected = auctions.length > 0 && selectedIds.length === auctions.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < auctions.length;

  if (loading) {
    return <div className="p-6">
      <div className="text-white">Carregando...</div>
    </div>;
  }

  return (
    <>
      <header className="bg-black border-b border-green-600/30">
        <div className="px-6 py-4">
          <h1 className="text-xl font-bold text-white">Gerenciar Leilões</h1>
        </div>
      </header>

      <div className="p-6">
        {/* Search and Create */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              ref={inputRef}
              placeholder="Buscar leilões..."
              value={inputValue}
              onChange={handleSearchChange}
              className="pl-10 bg-admin-input border-admin-border text-admin-foreground placeholder:text-admin-muted-foreground focus-visible:ring-admin-primary"
            />
          </div>
          <Button onClick={handleCreate} variant="admin">
            <Plus className="h-4 w-4 mr-2" />
            Novo Leilão
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-shrink-0">
            <TabsList className="bg-admin-muted border-admin-border">
              <TabsTrigger value="all" className="text-admin-muted-foreground data-[state=active]:text-admin-primary-foreground">
                Todos os Leilões
              </TabsTrigger>
              <TabsTrigger value="pre-bidding" className="text-admin-muted-foreground data-[state=active]:text-admin-primary-foreground">
                Pré Lance
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-wrap gap-3 flex-1">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-admin-input border border-admin-border text-admin-foreground rounded text-sm min-w-[140px]"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
            
            <select
              value={liveFilter}
              onChange={(e) => {
                setLiveFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-admin-input border border-admin-border text-admin-foreground rounded text-sm min-w-[120px]"
            >
              <option value="all">Todos</option>
              <option value="live">Ao Vivo</option>
              <option value="not-live">Offline</option>
            </select>
          </div>
        </div>

        <BulkActionsToolbar
          selectedIds={selectedIds}
          totalSelected={selectedIds.length}
          onClearSelection={() => setSelectedIds([])}
          table="auctions"
          customActions={[
            {
              key: 'duplicate',
              label: 'Duplicar Selecionados',
              icon: Copy,
              action: handleBulkDuplicate
            },
            {
              key: 'delete',
              label: 'Excluir Selecionados',
              icon: Trash2,
              variant: 'destructive',
              action: handleBulkDelete
            }
          ]}
          exportColumns={['name', 'status', 'is_live', 'start_date', 'end_date']}
          exportFileName="leiloes"
        />

        {/* Auctions Table */}
        <Card className="bg-black border-green-600/30">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300 w-12">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Selecionar todos"
                    />
                  </TableHead>
                  <TableHead className="text-gray-300">Nome</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Ao Vivo</TableHead>
                  <TableHead className="text-gray-300">Hora Início</TableHead>
                  <TableHead className="text-gray-300">Hora Fim</TableHead>
                  <TableHead className="text-gray-300">Qtd. Lotes</TableHead>
                  <TableHead className="text-gray-300">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auctions.map(auction => (
                  <TableRow key={auction.id} className="border-gray-700">
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(auction.id)}
                        onCheckedChange={(checked) => handleSelectOne(auction.id, checked as boolean)}
                        aria-label={`Selecionar ${auction.name}`}
                      />
                    </TableCell>
                    <TableCell className="text-white">{auction.name}</TableCell>
                     <TableCell>
                       <div className="flex flex-col gap-1">
                         <Badge variant={
                           auction.status === 'active' ? 'admin-success' :
                             'admin-muted'
                         }>
                           {auction.status === 'active' ? 'Visível' : 'Oculto'}
                         </Badge>
                         {auction.allow_pre_bidding && (
                           <Badge variant="outline" className="bg-yellow-900/30 text-yellow-400 border-yellow-600">
                             Pré Lance
                           </Badge>
                         )}
                       </div>
                     </TableCell>
                    <TableCell>
                      <Badge variant={
                        auction.is_live ? 'admin-success' : 'admin-muted'
                      }>
                        {auction.is_live ? 'Ao Vivo' : 'Offline'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white">
                      {auction.start_date ? (
                        <>
                          <div>{new Date(auction.start_date).toLocaleDateString('pt-BR')}</div>
                          <div className="text-sm text-gray-400">
                            {new Date(auction.start_date).toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-white">
                      {auction.end_date ? (
                        <>
                          <div>{new Date(auction.end_date).toLocaleDateString('pt-BR')}</div>
                          <div className="text-sm text-gray-400">
                            {new Date(auction.end_date).toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-white">
                      <Badge variant="outline" className="bg-blue-900/30 text-blue-400 border-blue-600">
                        {auctionLotCounts[auction.id] || 0} lotes
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleDuplicate(auction)}
                          className="text-green-400 hover:text-green-300 hover:bg-gray-800"
                          title="Duplicar Leilão"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleEdit(auction)}
                          className="text-blue-400 hover:text-blue-300 hover:bg-gray-800"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleDelete(auction.id)}
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

        {auctions.length === 0 && (
          <Card className="bg-black border-green-600/30 mt-6">
            <CardContent className="p-12 text-center">
              <p className="text-gray-400">Nenhum leilão encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>

      <AuctionEditModal
        auction={editingAuction}
        isOpen={isEditModalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
      />

      <AuctionCreateModal
        isOpen={isCreateModalOpen}
        onClose={handleCreateModalClose}
        onSave={handleCreateModalSave}
      />
    </>
  );
};

export default AdminAuctions;
