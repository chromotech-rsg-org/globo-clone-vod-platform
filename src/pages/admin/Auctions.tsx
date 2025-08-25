import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Auction } from '@/types/auction';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { useToast } from '@/components/ui/use-toast';
import CurrencyInput from '@/components/ui/currency-input';
import FilterControls from '@/components/admin/FilterControls';
import { Plus, Edit, Trash2, Play, Square, Copy } from 'lucide-react';
import AuctionBanner from '@/components/admin/AuctionBanner';
const Auctions = () => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingAuction, setEditingAuction] = useState<Auction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [liveFilter, setLiveFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const {
    toast
  } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    youtube_url: '',
    initial_bid_value: 0,
    current_bid_value: 0,
    bid_increment: 100,
    registration_wait_value: 5,
    registration_wait_unit: 'minutes' as 'minutes' | 'hours' | 'days',
    auction_date: '',
    start_time: '',
    end_time: '',
    status: 'inactive' as 'active' | 'inactive',
    auction_type: 'rural' as 'rural' | 'judicial',
    is_live: false
  });
  const fetchAuctions = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('auctions').select('*').order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setAuctions(data as Auction[] || []);

      // Set up real-time subscription
      const subscription = supabase.channel('auctions-changes').on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'auctions'
      }, () => {
        fetchAuctions();
      }).subscribe();
      return () => {
        supabase.removeChannel(subscription);
      };
    } catch (error) {
      console.error('Error fetching auctions:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os leilões",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Construir datas completas se fornecidas
      const startDateTime = formData.auction_date && formData.start_time ? `${formData.auction_date}T${formData.start_time}:00` : null;
      const endDateTime = formData.auction_date && formData.end_time ? `${formData.auction_date}T${formData.end_time}:00` : null;
      const dataToSave = {
        ...formData,
        start_date: startDateTime,
        end_date: endDateTime
      };

      // Remove campos temporários
      delete dataToSave.auction_date;
      delete dataToSave.start_time;
      delete dataToSave.end_time;
      if (editingAuction) {
        const {
          error
        } = await supabase.from('auctions').update(dataToSave).eq('id', editingAuction.id);
        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Leilão atualizado com sucesso"
        });
      } else {
        const {
          error
        } = await supabase.from('auctions').insert([dataToSave]);
        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Leilão criado com sucesso"
        });
      }
      setShowDialog(false);
      resetForm();
      fetchAuctions();
    } catch (error) {
      console.error('Error saving auction:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o leilão",
        variant: "destructive"
      });
    }
  };
  const handleEdit = (auction: Auction) => {
    setEditingAuction(auction);
    setFormData({
      name: auction.name,
      description: auction.description || '',
      youtube_url: auction.youtube_url || '',
      initial_bid_value: auction.initial_bid_value,
      current_bid_value: auction.current_bid_value,
      bid_increment: auction.bid_increment,
      registration_wait_value: auction.registration_wait_value || 5,
      registration_wait_unit: auction.registration_wait_unit || 'minutes',
      auction_date: auction.start_date ? auction.start_date.split('T')[0] : '',
      start_time: auction.start_date ? auction.start_date.split('T')[1]?.slice(0, 5) || '' : '',
      end_time: auction.end_date ? auction.end_date.split('T')[1]?.slice(0, 5) || '' : '',
      status: auction.status,
      auction_type: auction.auction_type,
      is_live: auction.is_live
    });
    setShowDialog(true);
  };
  const handleDuplicate = (auction: Auction) => {
    setEditingAuction(null); // Não é edição, é duplicação
    setFormData({
      name: `${auction.name} (Cópia)`,
      description: auction.description || '',
      youtube_url: auction.youtube_url || '',
      initial_bid_value: auction.initial_bid_value,
      current_bid_value: auction.initial_bid_value,
      // Reset para valor inicial
      bid_increment: auction.bid_increment,
      registration_wait_value: auction.registration_wait_value || 5,
      registration_wait_unit: auction.registration_wait_unit || 'minutes',
      auction_date: '',
      start_time: '',
      end_time: '',
      status: 'inactive' as const,
      // Sempre inativo para cópias
      auction_type: auction.auction_type,
      is_live: false // Sempre falso para cópias
    });
    setShowDialog(true);
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este leilão?')) return;
    try {
      const {
        error
      } = await supabase.from('auctions').delete().eq('id', id);
      if (error) throw error;
      toast({
        title: "Sucesso",
        description: "Leilão excluído com sucesso"
      });
      fetchAuctions();
    } catch (error) {
      console.error('Error deleting auction:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o leilão",
        variant: "destructive"
      });
    }
  };
  const resetForm = () => {
    setEditingAuction(null);
    setFormData({
      name: '',
      description: '',
      youtube_url: '',
      initial_bid_value: 0,
      current_bid_value: 0,
      bid_increment: 100,
      registration_wait_value: 5,
      registration_wait_unit: 'minutes',
      auction_date: '',
      start_time: '',
      end_time: '',
      status: 'inactive',
      auction_type: 'rural',
      is_live: false
    });
  };
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setLiveFilter('all');
    setTypeFilter('all');
  };
  const filteredAuctions = auctions.filter(auction => {
    const matchesSearch = searchTerm === '' || auction.name.toLowerCase().includes(searchTerm.toLowerCase()) || auction.description?.toLowerCase().includes(searchTerm.toLowerCase()) || auction.auction_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || auction.status === statusFilter;
    const matchesLive = liveFilter === 'all' || auction.is_live.toString() === liveFilter;
    const matchesType = typeFilter === 'all' || auction.auction_type === typeFilter;
    return matchesSearch && matchesStatus && matchesLive && matchesType;
  });
  useEffect(() => {
    fetchAuctions();
  }, []);
  return <div className="p-6 space-y-6">
      <AuctionBanner />
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-50">Gerenciar Leilões</h1>
          <p className="text-slate-300">Crie e gerencie leilões do sistema</p>
        </div>
        
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus size={16} className="mr-2" />
              Novo Leilão
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAuction ? 'Editar Leilão' : 'Novo Leilão'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Leilão</Label>
                  <Input id="name" value={formData.name} onChange={e => setFormData({
                  ...formData,
                  name: e.target.value
                })} required />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="auction_type">Tipo de Leilão</Label>
                  <Select value={formData.auction_type} onValueChange={(value: 'rural' | 'judicial') => setFormData({
                  ...formData,
                  auction_type: value
                })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rural">Rural</SelectItem>
                      <SelectItem value="judicial">Judicial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" value={formData.description} onChange={e => setFormData({
                ...formData,
                description: e.target.value
              })} rows={3} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="youtube_url">URL do YouTube</Label>
                <Input id="youtube_url" value={formData.youtube_url} onChange={e => setFormData({
                ...formData,
                youtube_url: e.target.value
              })} placeholder="https://www.youtube.com/watch?v=..." />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="initial_bid_value">Lance Inicial</Label>
                  <CurrencyInput value={formData.initial_bid_value} onChange={value => setFormData({
                  ...formData,
                  initial_bid_value: value
                })} placeholder="R$ 0,00" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="current_bid_value">Lance Atual</Label>
                  <CurrencyInput value={formData.current_bid_value} onChange={value => setFormData({
                  ...formData,
                  current_bid_value: value
                })} placeholder="R$ 0,00" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bid_increment">Incremento</Label>
                  <CurrencyInput value={formData.bid_increment} onChange={value => setFormData({
                  ...formData,
                  bid_increment: value
                })} placeholder="R$ 100,00" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="registration_wait_value">Tempo Espera Habilitação</Label>
                  <Input id="registration_wait_value" type="number" min="1" value={formData.registration_wait_value} onChange={e => setFormData({
                  ...formData,
                  registration_wait_value: parseInt(e.target.value) || 1
                })} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="registration_wait_unit">Unidade</Label>
                  <Select value={formData.registration_wait_unit} onValueChange={(value: 'minutes' | 'hours' | 'days') => setFormData({
                  ...formData,
                  registration_wait_unit: value
                })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">Minutos</SelectItem>
                      <SelectItem value="hours">Horas</SelectItem>
                      <SelectItem value="days">Dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="auction_date">Data do Leilão</Label>
                  <Input id="auction_date" type="date" value={formData.auction_date} onChange={e => setFormData({
                  ...formData,
                  auction_date: e.target.value
                })} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="start_time">Hora de Início</Label>
                  <Input id="start_time" type="time" value={formData.start_time} onChange={e => setFormData({
                  ...formData,
                  start_time: e.target.value
                })} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="end_time">Hora de Fim</Label>
                  <Input id="end_time" type="time" value={formData.end_time} onChange={e => setFormData({
                  ...formData,
                  end_time: e.target.value
                })} />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch id="status" checked={formData.status === 'active'} onCheckedChange={checked => setFormData({
                  ...formData,
                  status: checked ? 'active' : 'inactive'
                })} />
                  <Label htmlFor="status">Leilão Ativo</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="is_live" checked={formData.is_live} onCheckedChange={checked => setFormData({
                  ...formData,
                  is_live: checked
                })} />
                  <Label htmlFor="is_live">Transmissão ao Vivo</Label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingAuction ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Leilões ({filteredAuctions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <FilterControls searchTerm={searchTerm} onSearchChange={setSearchTerm} filters={[{
          key: 'status',
          label: 'Status',
          value: statusFilter,
          options: [{
            value: 'all',
            label: 'Todos'
          }, {
            value: 'active',
            label: 'Ativo'
          }, {
            value: 'inactive',
            label: 'Inativo'
          }],
          onChange: setStatusFilter
        }, {
          key: 'live',
          label: 'Transmissão',
          value: liveFilter,
          options: [{
            value: 'all',
            label: 'Todas'
          }, {
            value: 'true',
            label: 'Ao Vivo'
          }, {
            value: 'false',
            label: 'Gravado'
          }],
          onChange: setLiveFilter
        }, {
          key: 'type',
          label: 'Tipo',
          value: typeFilter,
          options: [{
            value: 'all',
            label: 'Todos'
          }, {
            value: 'rural',
            label: 'Rural'
          }, {
            value: 'judicial',
            label: 'Judicial'
          }],
          onChange: setTypeFilter
        }]} onClearFilters={clearFilters} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leilões Filtrados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div> : <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Lance Atual</TableHead>
                  <TableHead>Transmissão</TableHead>
                  <TableHead>Programação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAuctions.map(auction => <TableRow key={auction.id}>
                    <TableCell className="font-medium">{auction.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {auction.auction_type === 'rural' ? 'Rural' : 'Judicial'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={auction.status === 'active' ? 'default' : 'secondary'}>
                        {auction.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(auction.current_bid_value)}</TableCell>
                    <TableCell>
                      <Badge variant={auction.is_live ? "default" : "secondary"} className="flex items-center gap-1 w-fit">
                        {auction.is_live ? <Play size={12} /> : <Square size={12} />}
                        {auction.is_live ? 'Ao Vivo' : 'Gravado'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {auction.start_date && auction.end_date ? <div className="text-sm">
                          <div>{formatDate(auction.start_date).split(' ')[0]}</div>
                          <div className="text-muted-foreground">
                            {auction.start_date.split('T')[1]?.slice(0, 5)} - {auction.end_date.split('T')[1]?.slice(0, 5)}
                          </div>
                        </div> : <span className="text-muted-foreground">Não definida</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(auction)} title="Editar leilão">
                          <Edit size={14} />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDuplicate(auction)} title="Duplicar leilão">
                          <Copy size={14} />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(auction.id)} title="Excluir leilão">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>}
        </CardContent>
      </Card>
    </div>;
};
export default Auctions;