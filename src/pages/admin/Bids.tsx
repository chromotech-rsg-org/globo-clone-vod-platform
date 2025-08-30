
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Search, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

const AdminBids = () => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchBids();
  }, []);

  const fetchBids = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bids')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setBids(data as Bid[] || []);
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

  const filteredBids = bids.filter(bid =>
    bid.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (bid.user_id?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

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
              onChange={e => setSearchTerm(e.target.value)}
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
                {filteredBids.map(bid => (
                  <TableRow key={bid.id} className="border-admin-border">
                    <TableCell className="text-admin-table-text">{bid.id.slice(0, 8)}...</TableCell>
                    <TableCell className="text-admin-table-text">{bid.auction_id.slice(0, 8)}...</TableCell>
                    <TableCell className="text-admin-table-text">{bid.user_id.slice(0, 8)}...</TableCell>
                    <TableCell className="text-admin-table-text">R$ {bid.bid_value}</TableCell>
                    <TableCell>
                      <Badge variant={
                        bid.status === 'approved' ? 'admin-success' :
                        bid.status === 'rejected' ? 'admin-danger' :
                        'secondary'
                      }>
                        {bid.status}
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
                          className="text-blue-400 hover:text-blue-300 hover:bg-gray-800"
                        >
                          <Eye className="h-4 w-4" />
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
          </CardContent>
        </Card>

        {filteredBids.length === 0 && (
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
