import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Plus, Search, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import FilterControls from '@/components/admin/FilterControls';

interface Auction {
  id: string;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  start_price: number | null;
  current_price: number | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  package_id: string | null;
}

const AdminAuctions = () => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<{ status: string | null }>({ status: null });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchAuctions();
  }, [filters]);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('auctions')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      setAuctions(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar leilões:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os leilões",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: Auction) => {
    navigate(`/admin/leiloes/editar/${item.id}`);
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
    navigate('/admin/leiloes/criar');
  };

  const filteredAuctions = auctions.filter(auction =>
    auction.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              placeholder="Buscar leilões..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 bg-black border-green-600/30 text-white"
            />
          </div>
          <Button onClick={handleCreate} variant="admin">
            <Plus className="h-4 w-4 mr-2" />
            Novo Leilão
          </Button>
        </div>

        <FilterControls filters={filters} setFilters={setFilters} />

        {/* Auctions Table */}
        <Card className="bg-black border-green-600/30">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Título</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Data de Início</TableHead>
                  <TableHead className="text-gray-300">Data de Encerramento</TableHead>
                  <TableHead className="text-gray-300">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAuctions.map(auction => (
                  <TableRow key={auction.id} className="border-gray-700">
                    <TableCell className="text-white">{auction.title}</TableCell>
                    <TableCell>
                      <Badge variant={
                        auction.status === 'active' ? 'admin-success' :
                          auction.status === 'scheduled' ? 'admin' :
                            'admin-muted'
                      }>
                        {auction.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white">{auction.start_date}</TableCell>
                    <TableCell className="text-white">{auction.end_date}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => navigate(`/admin/leiloes/${auction.id}`)}
                          className="text-blue-400 hover:text-blue-300 hover:bg-gray-800"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleEdit(auction)}
                          className="text-gray-400 hover:text-white hover:bg-gray-800"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleDelete(auction.id)}
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

        {filteredAuctions.length === 0 && (
          <Card className="bg-black border-green-600/30 mt-6">
            <CardContent className="p-12 text-center">
              <p className="text-gray-400">Nenhum leilão encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default AdminAuctions;
