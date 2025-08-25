import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MoreVertical, Edit, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Auction } from '@/types/auction';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface DataTableProps {
  data: any[]
}

const Auctions = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [editingAuction, setEditingAuction] = useState<Auction | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<'rural' | 'judicial' | 'all'>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    youtube_url: '',
    initial_bid_value: 0,
    bid_increment: 100,
    increment_mode: 'fixed',
    min_custom_bid: 0,
    max_custom_bid: 0,
    start_date: '',
    end_date: '',
    registration_wait_value: 5,
    registration_wait_unit: 'minutes' as 'minutes' | 'hours' | 'days',
    status: 'inactive' as 'active' | 'inactive',
    auction_type: 'rural' as 'rural' | 'judicial'
  });

  const fetchAuctions = useCallback(async () => {
    try {
      let query = supabase
        .from('auctions')
        .select('*')
        .like('name', `%${search}%`);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (typeFilter !== 'all') {
        query = query.eq('auction_type', typeFilter);
      }

      if (startDate) {
        const formattedStartDate = format(startDate, 'yyyy-MM-dd', { locale: ptBR });
        query = query.gte('start_date', formattedStartDate);
      }

      if (endDate) {
        const formattedEndDate = format(endDate, 'yyyy-MM-dd', { locale: ptBR });
        query = query.lte('end_date', formattedEndDate);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setAuctions(data as Auction[]);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao buscar leilões",
        variant: "destructive"
      });
    }
  }, [search, statusFilter, typeFilter, startDate, endDate]);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  const handleEdit = (auction: Auction) => {
    setEditingAuction(auction);
    setFormData({
      name: auction.name,
      description: auction.description || '',
      youtube_url: auction.youtube_url || '',
      initial_bid_value: auction.initial_bid_value,
      bid_increment: auction.bid_increment,
      increment_mode: auction.increment_mode || 'fixed',
      min_custom_bid: auction.min_custom_bid || 0,
      max_custom_bid: auction.max_custom_bid || 0,
      start_date: auction.start_date || '',
      end_date: auction.end_date || '',
      registration_wait_value: auction.registration_wait_value,
      registration_wait_unit: auction.registration_wait_unit,
      status: auction.status,
      auction_type: auction.auction_type
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este leilão?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('auctions')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Leilão excluído com sucesso",
      });

      fetchAuctions();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir leilão",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);

    try {
      const { name, description, youtube_url, initial_bid_value, bid_increment, increment_mode, min_custom_bid, max_custom_bid, start_date, end_date, registration_wait_value, registration_wait_unit, status, auction_type } = formData;

      if (increment_mode === 'custom' && (min_custom_bid >= max_custom_bid)) {
        toast({
          title: "Erro",
          description: "O lance mínimo deve ser menor que o lance máximo.",
          variant: "destructive"
        });
        return;
      }

      const payload = {
        name,
        description,
        youtube_url,
        initial_bid_value,
        bid_increment,
        increment_mode,
        min_custom_bid,
        max_custom_bid,
        start_date,
        end_date,
        registration_wait_value,
        registration_wait_unit,
        status,
        auction_type
      };

      let result;
      if (editingAuction) {
        const { error } = await supabase
          .from('auctions')
          .update(payload)
          .eq('id', editingAuction.id);

        if (error) throw error;
        result = { success: true, message: 'Leilão atualizado com sucesso' };
      } else {
        const { error } = await supabase
          .from('auctions')
          .insert(payload);

        if (error) throw error;
        result = { success: true, message: 'Leilão criado com sucesso' };
      }

      toast({
        title: "Sucesso",
        description: result.message,
      });

      setIsModalOpen(false);
      setEditingAuction(null);
      setFormData({
        name: '',
        description: '',
        youtube_url: '',
        initial_bid_value: 0,
        bid_increment: 100,
        increment_mode: 'fixed',
        min_custom_bid: 0,
        max_custom_bid: 0,
        start_date: '',
        end_date: '',
        registration_wait_value: 5,
        registration_wait_unit: 'minutes',
        status: 'inactive',
        auction_type: 'rural'
      });

      fetchAuctions();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar leilão",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <header className="bg-admin-header border-b border-admin-border">
        <div className="px-6 py-4">
          <h1 className="text-xl font-bold text-admin-foreground text-slate-50">Gerenciar Leilões</h1>
          <p className="text-admin-muted-foreground text-sm">
            Crie, edite e gerencie os leilões da plataforma
          </p>
        </div>
      </header>

      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Input
            type="search"
            placeholder="Buscar leilão..."
            className="max-w-md bg-admin-input border-admin-border text-admin-foreground"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex items-center space-x-4">
            <Select onValueChange={(value) => setStatusFilter(value as 'active' | 'inactive' | 'all')}>
              <SelectTrigger className="bg-admin-input border-admin-border text-admin-foreground">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={(value) => setTypeFilter(value as 'rural' | 'judicial' | 'all')}>
              <SelectTrigger className="bg-admin-input border-admin-border text-admin-foreground">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="rural">Rural</SelectItem>
                <SelectItem value="judicial">Judicial</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "justify-start text-left font-normal bg-admin-input border-admin-border text-admin-foreground",
                    !startDate && !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate && endDate ? (
                    <>
                      {format(startDate, "dd/MM/yyyy")} - {format(endDate, "dd/MM/yyyy")}
                    </>
                  ) : (
                    <span>Filtrar por data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-admin-card border-admin-border">
                <Calendar
                  mode="range"
                  defaultMonth={startDate ? startDate : new Date()}
                  selected={{ from: startDate, to: endDate }}
                  onSelect={(date) => {
                    if (date?.from) {
                      setStartDate(date.from);
                    }
                    if (date?.to) {
                      setEndDate(date.to);
                    }
                  }}
                  numberOfMonths={2}
                  pagedNavigation
                  className="border-none shadow-sm"
                />
              </PopoverContent>
            </Popover>

            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-admin-primary text-admin-primary-foreground hover:bg-admin-primary/90"
            >
              Novo Leilão
            </Button>
          </div>
        </div>

        <Table className="bg-admin-table-bg">
          <TableCaption className="text-admin-foreground">Lista de leilões cadastrados no sistema.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px] text-admin-foreground">Nome</TableHead>
              <TableHead className="text-admin-foreground">Status</TableHead>
              <TableHead className="text-admin-foreground">Tipo</TableHead>
              <TableHead className="text-admin-foreground">Data Início</TableHead>
              <TableHead className="text-admin-foreground">Data Fim</TableHead>
              <TableHead className="text-right text-admin-foreground">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auctions.map((auction) => (
              <TableRow key={auction.id}>
                <TableCell className="font-medium text-admin-foreground">{auction.name}</TableCell>
                <TableCell className="text-admin-foreground">{auction.status}</TableCell>
                <TableCell className="text-admin-foreground">{auction.auction_type}</TableCell>
                <TableCell className="text-admin-foreground">{auction.start_date}</TableCell>
                <TableCell className="text-admin-foreground">{auction.end_date}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreVertical className="h-4 w-4 text-admin-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleEdit(auction)}>
                        <Edit className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDelete(auction.id)} className="text-red-500">
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-admin-card border-admin-border">
            <DialogHeader>
              <DialogTitle className="text-admin-foreground">
                {editingAuction ? 'Editar Leilão' : 'Novo Leilão'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-admin-foreground">Nome</Label>
                <Input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-admin-input border-admin-border text-admin-foreground"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-admin-foreground">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-admin-input border-admin-border text-admin-foreground"
                />
              </div>

              <div>
                <Label htmlFor="youtube_url" className="text-admin-foreground">URL do Youtube</Label>
                <Input
                  type="url"
                  id="youtube_url"
                  value={formData.youtube_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, youtube_url: e.target.value }))}
                  className="bg-admin-input border-admin-border text-admin-foreground"
                />
              </div>

              <div>
                <Label htmlFor="initial_bid_value" className="text-admin-foreground">Valor Inicial do Lance (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  id="initial_bid_value"
                  value={formData.initial_bid_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, initial_bid_value: parseFloat(e.target.value) || 0 }))}
                  className="bg-admin-input border-admin-border text-admin-foreground"
                  required
                />
              </div>

              {/* Configurações de Incremento */}
              <div className="space-y-4 border rounded-lg p-4 bg-admin-muted">
                <h4 className="font-medium text-admin-foreground">Configurações de Lance</h4>
                
                <div>
                  <Label className="text-admin-foreground">Modo de Incremento</Label>
                  <Select
                    value={formData.increment_mode}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, increment_mode: value as 'fixed' | 'custom' }))}
                  >
                    <SelectTrigger className="bg-admin-input border-admin-border text-admin-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Incremento Fixo</SelectItem>
                      <SelectItem value="custom">Incremento Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-admin-muted-foreground mt-1">
                    {formData.increment_mode === 'fixed' 
                      ? 'Lance deve ser exatamente o valor atual + incremento'
                      : 'Lance pode ser qualquer valor dentro do intervalo definido'
                    }
                  </p>
                </div>

                {formData.increment_mode === 'fixed' ? (
                  <div>
                    <Label className="text-admin-foreground">Valor do Incremento (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.bid_increment}
                      onChange={(e) => setFormData(prev => ({ ...prev, bid_increment: parseFloat(e.target.value) || 0 }))}
                      className="bg-admin-input border-admin-border text-admin-foreground"
                      placeholder="100.00"
                      required
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-admin-foreground">Lance Mínimo (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.min_custom_bid}
                        onChange={(e) => setFormData(prev => ({ ...prev, min_custom_bid: parseFloat(e.target.value) || 0 }))}
                        className="bg-admin-input border-admin-border text-admin-foreground"
                        placeholder="50.00"
                        required={formData.increment_mode === 'custom'}
                      />
                    </div>
                    <div>
                      <Label className="text-admin-foreground">Lance Máximo (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.max_custom_bid}
                        onChange={(e) => setFormData(prev => ({ ...prev, max_custom_bid: parseFloat(e.target.value) || 0 }))}
                        className="bg-admin-input border-admin-border text-admin-foreground"
                        placeholder="1000.00"
                        required={formData.increment_mode === 'custom'}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-admin-foreground">Data de Início</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="bg-admin-input border-admin-border text-admin-foreground"
                  />
                </div>
                <div>
                  <Label className="text-admin-foreground">Data de Fim</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    className="bg-admin-input border-admin-border text-admin-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-admin-foreground">Valor de Espera para Registro</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.registration_wait_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, registration_wait_value: parseInt(e.target.value) || 0 }))}
                    className="bg-admin-input border-admin-border text-admin-foreground"
                  />
                </div>
                <div>
                  <Label className="text-admin-foreground">Unidade de Tempo para Registro</Label>
                  <Select
                    value={formData.registration_wait_unit}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, registration_wait_unit: value as 'minutes' | 'hours' | 'days' }))}
                  >
                    <SelectTrigger className="bg-admin-input border-admin-border text-admin-foreground">
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

              <div>
                <Label className="text-admin-foreground">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as 'active' | 'inactive' }))}
                >
                  <SelectTrigger className="bg-admin-input border-admin-border text-admin-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-admin-foreground">Tipo de Leilão</Label>
                <Select
                  value={formData.auction_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, auction_type: value as 'rural' | 'judicial' }))}
                >
                  <SelectTrigger className="bg-admin-input border-admin-border text-admin-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rural">Rural</SelectItem>
                    <SelectItem value="judicial">Judicial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="border-admin-border text-admin-foreground hover:bg-admin-muted"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-admin-primary text-admin-primary-foreground hover:bg-admin-primary/90"
                >
                  {saving ? 'Salvando...' : (editingAuction ? 'Atualizar' : 'Criar')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default Auctions;
