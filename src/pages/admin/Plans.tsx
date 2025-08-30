import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Trash2, Plus, Save, X, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ErrorBoundary from '@/components/ErrorBoundary';
import { formatBillingCycle } from '@/utils/formatters';

interface Plan {
  id: string;
  name: string;
  active: boolean | null;
  best_seller: boolean | null;
  price: number;
  free_days: number | null;
  billing_cycle: string | null;
  payment_type: string | null;
  description: string | null;
  benefits: string[] | null;
  package_id: string | null;
  priority: number | null;
}

const AdminPlans = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<Plan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const {
    toast
  } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    active: true,
    best_seller: false,
    price: 0,
    free_days: 0,
    billing_cycle: 'monthly',
    payment_type: 'credit_card',
    description: '',
    benefits: '',
    priority: 0
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);

      // Verificar autenticação antes de fazer a query
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado');
      }
      const {
        data,
        error
      } = await supabase.from('plans').select(`
          id,
          name,
          active,
          best_seller,
          price,
          free_days,
          billing_cycle,
          payment_type,
          description,
          benefits,
          package_id,
          priority
        `).order('priority', {
        ascending: true
      });
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      setPlans(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar planos:', error);
      let errorMessage = "Não foi possível carregar os planos";
      if (error.message === 'Usuário não autenticado') {
        errorMessage = "Você precisa estar logado para acessar esta página";
      } else if (error.code === '42501') {
        errorMessage = "Você não tem permissão para acessar esta página";
      } else if (error.code === 'PGRST116') {
        errorMessage = "Nenhum plano encontrado";
      }
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Verificar autenticação
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      // Validar dados obrigatórios
      if (!formData.name.trim()) {
        throw new Error('Nome é obrigatório');
      }
      if (!formData.price || formData.price < 0) {
        throw new Error('Preço deve ser maior que zero');
      }
      const benefitsArray = formData.benefits.split('\n').filter(b => b.trim());
      const planData = {
        name: formData.name.trim(),
        active: formData.active,
        best_seller: formData.best_seller,
        price: Number(formData.price),
        free_days: Number(formData.free_days) || 0,
        billing_cycle: formData.billing_cycle,
        payment_type: formData.payment_type,
        description: formData.description.trim() || null,
        benefits: benefitsArray.length > 0 ? benefitsArray : null,
        priority: Number(formData.priority) || 0
      };
      if (editingItem) {
        // Update existing
        const {
          error
        } = await supabase.from('plans').update(planData).eq('id', editingItem.id);
        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Plano atualizado com sucesso"
        });
      } else {
        // Create new
        const {
          error
        } = await supabase.from('plans').insert([planData]);
        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Plano criado com sucesso"
        });
      }
      await fetchPlans();
      resetForm();
    } catch (error: any) {
      let errorMessage = "Não foi possível salvar o plano";
      if (error.message === 'Usuário não autenticado') {
        errorMessage = "Você precisa estar logado para realizar esta ação";
      } else if (error.message.includes('obrigatório')) {
        errorMessage = error.message;
      } else if (error.code === '23505') {
        errorMessage = "Já existe um plano com este nome";
      } else if (error.code === '42501') {
        errorMessage = "Você não tem permissão para realizar esta ação";
      }
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este plano?')) return;
    try {
      const {
        error
      } = await supabase.from('plans').delete().eq('id', id);
      if (error) throw error;
      toast({
        title: "Sucesso",
        description: "Plano excluído com sucesso"
      });
      fetchPlans();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o plano",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (item: Plan) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      active: item.active || false,
      best_seller: item.best_seller || false,
      price: item.price,
      free_days: item.free_days || 0,
      billing_cycle: item.billing_cycle || 'monthly',
      payment_type: item.payment_type || 'credit_card',
      description: item.description || '',
      benefits: (item.benefits || []).join('\n'),
      priority: item.priority || 0
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingItem(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setIsDialogOpen(false);
    setFormData({
      name: '',
      active: true,
      best_seller: false,
      price: 0,
      free_days: 0,
      billing_cycle: 'monthly',
      payment_type: 'credit_card',
      description: '',
      benefits: '',
      priority: 0
    });
  };

  const filteredPlans = plans.filter(plan => plan.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) {
    return <div className="p-6">
        <div className="text-white">Carregando...</div>
      </div>;
  }

  return <>
      <header className="bg-black border-b border-green-600/30">
        <div className="px-6 py-4">
          <h1 className="text-xl font-bold text-white">Gerenciar Planos</h1>
        </div>
      </header>

      <div className="p-6">
        {/* Search and Create */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input placeholder="Buscar planos..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-black border-green-600/30 text-white" />
          </div>
          
          <Button onClick={handleCreate} variant="admin">
            <Plus className="h-4 w-4 mr-2" />
            Novo Plano
          </Button>
        </div>

        {/* Plans Table */}
        <Card className="bg-black border-green-600/30">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Prioridade</TableHead>
                  <TableHead className="text-gray-300">Nome</TableHead>
                  <TableHead className="text-gray-300">Preço</TableHead>
                  <TableHead className="text-gray-300">Ciclo</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Best Seller</TableHead>
                  <TableHead className="text-gray-300">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans.map(plan => <TableRow key={plan.id} className="border-gray-700">
                    <TableCell className="text-white">{plan.priority}</TableCell>
                    <TableCell className="text-white">{plan.name}</TableCell>
                    <TableCell className="text-white">R$ {plan.price.toFixed(2)}</TableCell>
                    <TableCell className="text-white">{formatBillingCycle(plan.billing_cycle || '')}</TableCell>
                    <TableCell>
                      <Badge variant={plan.active ? 'admin-success' : 'admin-muted'}>
                        {plan.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={plan.best_seller ? 'admin-success' : 'admin-muted'}>
                        {plan.best_seller ? 'Sim' : 'Não'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(plan)} className="text-gray-400 hover:text-white hover:bg-gray-800">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(plan.id)} className="text-red-400 hover:text-red-300 hover:bg-gray-800">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {filteredPlans.length === 0 && <Card className="bg-black border-green-600/30 mt-6">
            <CardContent className="p-12 text-center">
              <p className="text-gray-400">Nenhum plano encontrado</p>
            </CardContent>
          </Card>}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-black border-green-600/30 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar Plano' : 'Novo Plano'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-gray-300">Nome</Label>
                <Input id="name" value={formData.name} onChange={e => setFormData({
                ...formData,
                name: e.target.value
              })} className="bg-black border-green-600/30 text-white" placeholder="Nome do plano" />
              </div>

              <div>
                <Label htmlFor="priority" className="text-gray-300">Prioridade</Label>
                <Input id="priority" type="number" value={formData.priority} onChange={e => setFormData({
                ...formData,
                priority: parseInt(e.target.value) || 0
              })} className="bg-black border-green-600/30 text-white" placeholder="0" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price" className="text-gray-300">Preço (R$)</Label>
                <Input id="price" type="number" step="0.01" value={formData.price} onChange={e => setFormData({
                ...formData,
                price: parseFloat(e.target.value) || 0
              })} className="bg-black border-green-600/30 text-white" placeholder="0.00" />
              </div>

              <div>
                <Label htmlFor="free_days" className="text-gray-300">Dias Grátis</Label>
                <Input id="free_days" type="number" value={formData.free_days} onChange={e => setFormData({
                ...formData,
                free_days: parseInt(e.target.value) || 0
              })} className="bg-black border-green-600/30 text-white" placeholder="0" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="billing_cycle" className="text-gray-300">Ciclo de Cobrança</Label>
                <Select value={formData.billing_cycle} onValueChange={value => setFormData({
                ...formData,
                billing_cycle: value
              })}>
                  <SelectTrigger className="bg-black border-green-600/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                    <SelectItem value="semiannual">Semestral</SelectItem>
                    <SelectItem value="annual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="payment_type" className="text-gray-300">Tipo de Pagamento</Label>
                <Select value={formData.payment_type} onValueChange={value => setFormData({
                ...formData,
                payment_type: value
              })}>
                  <SelectTrigger className="bg-black border-green-600/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-gray-300">Descrição</Label>
              <Textarea id="description" value={formData.description} onChange={e => setFormData({
              ...formData,
              description: e.target.value
            })} className="bg-black border-green-600/30 text-white" placeholder="Descrição do plano" rows={3} />
            </div>

            <div>
              <Label htmlFor="benefits" className="text-gray-300">Benefícios (um por linha)</Label>
              <Textarea id="benefits" value={formData.benefits} onChange={e => setFormData({
              ...formData,
              benefits: e.target.value
            })} className="bg-black border-green-600/30 text-white" placeholder="Globoplay completo&#10;Canais ao vivo&#10;Download para offline" rows={4} />
            </div>

            <div className="flex space-x-6">
              <div className="flex items-center space-x-2">
                <Switch id="active" checked={formData.active} onCheckedChange={checked => setFormData({
                ...formData,
                active: checked
              })} />
                <Label htmlFor="active" className="text-gray-300">Ativo</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="best_seller" checked={formData.best_seller} onCheckedChange={checked => setFormData({
                ...formData,
                best_seller: checked
              })} />
                <Label htmlFor="best_seller" className="text-gray-300">Best Seller</Label>
              </div>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button onClick={handleSave} variant="admin" className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
              <Button onClick={resetForm} variant="outline" className="border-gray-600 text-zinc-950">
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>;
};

export default AdminPlans;
