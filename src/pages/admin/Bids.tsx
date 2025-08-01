import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Bid } from '@/types/auction';
import { Check, X, Eye, Clock, Trophy, AlertCircle } from 'lucide-react';
import { formatDateTime, formatCurrency } from '@/utils/formatters';

interface BidWithDetails extends Bid {
  auction_name?: string;
  auction_item_name?: string;
  user_name?: string;
  user_email?: string;
}

const Bids = () => {
  const [bids, setBids] = useState<BidWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBid, setSelectedBid] = useState<BidWithDetails | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [auctionFilter, setAuctionFilter] = useState<string>('all');
  const [auctions, setAuctions] = useState<any[]>([]);
  const [internalNotes, setInternalNotes] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const { toast } = useToast();

  const fetchBids = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('bids')
        .select(`
          *,
          auctions!inner(name),
          auction_items!inner(name),
          profiles!bids_user_id_fkey(name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = data.map(item => ({
        ...item,
        auction_name: item.auctions?.name,
        auction_item_name: item.auction_items?.name,
        user_name: item.profiles?.name,
        user_email: item.profiles?.email
      })) as BidWithDetails[];

      setBids(formattedData);
    } catch (error) {
      console.error('Error fetching bids:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os lances",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAuctions = async () => {
    try {
      const { data, error } = await supabase
        .from('auctions')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setAuctions(data || []);
    } catch (error) {
      console.error('Error fetching auctions:', error);
    }
  };

  const handleStatusUpdate = async (bidId: string, status: 'approved' | 'rejected') => {
    try {
      const updateData: any = {
        status,
        internal_notes: internalNotes,
        client_notes: clientNotes
      };

      const { error } = await supabase
        .from('bids')
        .update(updateData)
        .eq('id', bidId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Lance ${status === 'approved' ? 'aprovado' : 'rejeitado'} com sucesso`,
      });

      setDialogOpen(false);
      setSelectedBid(null);
      setInternalNotes('');
      setClientNotes('');
      fetchBids();
    } catch (error) {
      console.error('Error updating bid:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o lance",
        variant: "destructive"
      });
    }
  };

  const handleWinnerToggle = async (bidId: string, isWinner: boolean) => {
    try {
      const { error } = await supabase
        .from('bids')
        .update({ is_winner: isWinner })
        .eq('id', bidId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Lance ${isWinner ? 'marcado como vencedor' : 'removido como vencedor'}`,
      });

      fetchBids();
    } catch (error) {
      console.error('Error updating winner status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status de vencedor",
        variant: "destructive"
      });
    }
  };

  const openDialog = (bid: BidWithDetails) => {
    setSelectedBid(bid);
    setInternalNotes(bid.internal_notes || '');
    setClientNotes(bid.client_notes || '');
    setDialogOpen(true);
  };

  const getStatusBadge = (status: string, isWinner: boolean) => {
    if (isWinner) {
      return <Badge className="bg-yellow-500 text-white"><Trophy className="h-3 w-3 mr-1" />Vencedor</Badge>;
    }
    
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500 text-white"><Check className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Rejeitado</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'superseded':
        return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />Superado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredBids = bids.filter(bid => {
    if (statusFilter !== 'all' && bid.status !== statusFilter) return false;
    if (auctionFilter !== 'all' && bid.auction_id !== auctionFilter) return false;
    return true;
  });

  useEffect(() => {
    fetchBids();
    fetchAuctions();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Lances</h1>
          <p className="text-muted-foreground">Gerencie todos os lances dos leilões</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Lista de Lances</CardTitle>
              <CardDescription>
                {filteredBids.length} lance(s) encontrado(s)
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                  <SelectItem value="superseded">Superado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={auctionFilter} onValueChange={setAuctionFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por leilão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os leilões</SelectItem>
                  {auctions.map(auction => (
                    <SelectItem key={auction.id} value={auction.id}>
                      {auction.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Leilão</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Valor do Lance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBids.map((bid) => (
                <TableRow key={bid.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{bid.user_name}</div>
                      <div className="text-sm text-muted-foreground">{bid.user_email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{bid.auction_name}</TableCell>
                  <TableCell>{bid.auction_item_name}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(bid.bid_value)}
                  </TableCell>
                  <TableCell>{getStatusBadge(bid.status, bid.is_winner)}</TableCell>
                  <TableCell>{formatDateTime(bid.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDialog(bid)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Gerenciar
                      </Button>
                      {bid.status === 'approved' && (
                        <Button
                          variant={bid.is_winner ? "destructive" : "default"}
                          size="sm"
                          onClick={() => handleWinnerToggle(bid.id, !bid.is_winner)}
                        >
                          <Trophy className="h-4 w-4 mr-2" />
                          {bid.is_winner ? 'Remover' : 'Vencedor'}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Lance</DialogTitle>
            <DialogDescription>
              Aprove, rejeite ou marque como vencedor
            </DialogDescription>
          </DialogHeader>
          
          {selectedBid && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Usuário</Label>
                  <p className="text-sm">{selectedBid.user_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedBid.user_email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Leilão</Label>
                  <p className="text-sm">{selectedBid.auction_name}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Item</Label>
                  <p className="text-sm">{selectedBid.auction_item_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Valor do Lance</Label>
                  <p className="text-sm font-bold text-green-600">
                    {formatCurrency(selectedBid.bid_value)}
                  </p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Status Atual</Label>
                <div className="mt-1">
                  {getStatusBadge(selectedBid.status, selectedBid.is_winner)}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="internal-notes">Observações Internas</Label>
                  <Textarea
                    id="internal-notes"
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Notas para uso interno..."
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="client-notes">Observações para o Cliente</Label>
                  <Textarea
                    id="client-notes"
                    value={clientNotes}
                    onChange={(e) => setClientNotes(e.target.value)}
                    placeholder="Mensagem que será enviada ao cliente..."
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="space-x-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            {selectedBid?.status === 'pending' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => handleStatusUpdate(selectedBid.id, 'rejected')}
                >
                  <X className="h-4 w-4 mr-2" />
                  Rejeitar
                </Button>
                <Button
                  onClick={() => handleStatusUpdate(selectedBid.id, 'approved')}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Aprovar
                </Button>
              </>
            )}
            {selectedBid?.status === 'approved' && (
              <Button
                variant={selectedBid.is_winner ? "destructive" : "default"}
                onClick={() => handleWinnerToggle(selectedBid.id, !selectedBid.is_winner)}
              >
                <Trophy className="h-4 w-4 mr-2" />
                {selectedBid.is_winner ? 'Remover Vencedor' : 'Marcar como Vencedor'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Bids;