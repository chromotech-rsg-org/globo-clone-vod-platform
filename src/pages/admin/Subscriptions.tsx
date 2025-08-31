import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Edit, Plus, Trash2, Users, DollarSign, CalendarDays } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatDate } from '@/utils/formatters';

interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  profiles: {
    name: string;
    email: string;
  };
  plans: {
    name: string;
    price: number;
    billing_cycle: string;
  };
}

interface Plan {
  id: string;
  name: string;
  price: number;
  billing_cycle: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface SubscriptionForm {
  user_id: string;
  plan_id: string;
  status: string;
  start_date: string;
  end_date: string;
}

const AdminSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const {
    toast
  } = useToast();
  const [formData, setFormData] = useState<SubscriptionForm>({
    user_id: '',
    plan_id: '',
    status: 'active',
    start_date: new Date().toISOString().split('T')[0],
    end_date: ''
  });

  useEffect(() => {
    fetchSubscriptions();
    fetchPlans();
    fetchUsers();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('subscriptions').select(`
          *,
          profiles (name, email),
          plans (name, price, billing_cycle)
        `).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.error('Erro ao buscar assinaturas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as assinaturas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('plans').select('id, name, price, billing_cycle').eq('active', true).order('name');
      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('profiles').select('id, name, email').order('name');
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.user_id || !formData.plan_id) {
      toast({
        title: "Erro",
        description: "Usuário e plano são obrigatórios",
        variant: "destructive"
      });
      return;
    }
    try {
      const subscriptionData = {
        ...formData,
        end_date: formData.end_date || null
      };
      if (editingSubscription) {
        const {
          error
        } = await supabase.from('subscriptions').update(subscriptionData).eq('id', editingSubscription.id);
        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Assinatura atualizada com sucesso"
        });
      } else {
        const {
          error
        } = await supabase.from('subscriptions').insert(subscriptionData);
        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Assinatura criada com sucesso"
        });
      }
      setIsDialogOpen(false);
      setEditingSubscription(null);
      resetForm();
      fetchSubscriptions();
    } catch (error: any) {
      console.error('Erro ao salvar assinatura:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar assinatura",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setFormData({
      user_id: subscription.user_id,
      plan_id: subscription.plan_id,
      status: subscription.status,
      start_date: subscription.start_date.split('T')[0],
      end_date: subscription.end_date ? subscription.end_date.split('T')[0] : ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta assinatura?')) return;
    try {
      const {
        error
      } = await supabase.from('subscriptions').delete().eq('id', id);
      if (error) throw error;
      toast({
        title: "Sucesso",
        description: "Assinatura excluída com sucesso"
      });
      fetchSubscriptions();
    } catch (error: any) {
      console.error('Erro ao excluir assinatura:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir assinatura",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      plan_id: '',
      status: 'active',
      start_date: new Date().toISOString().split('T')[0],
      end_date: ''
    });
  };

  const openCreateDialog = () => {
    setEditingSubscription(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const filteredSubscriptions = subscriptions.filter(subscription => {
    const matchesSearch = subscription.profiles?.name.toLowerCase().includes(searchTerm.toLowerCase()) || subscription.profiles?.email.toLowerCase().includes(searchTerm.toLowerCase()) || subscription.plans?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || subscription.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: {
      [key: string]: 'default' | 'secondary' | 'destructive' | 'outline';
    } = {
      active: 'default',
      inactive: 'secondary',
      cancelled: 'destructive',
      expired: 'outline'
    };
    
    const statusLabels: { [key: string]: string } = {
      active: 'Ativo',
      inactive: 'Inativo', 
      cancelled: 'Cancelado',
      expired: 'Expirado'
    };
    
    return <Badge variant={variants[status] || 'outline'}>{statusLabels[status] || status}</Badge>;
  };

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'active').length,
    revenue: subscriptions.filter(s => s.status === 'active').reduce((sum, s) => sum + (s.plans?.price || 0), 0)
  };

  return <>
      {loading ? <div className="p-6">
          <div className="text-admin-table-text">Carregando...</div>
        </div> : <>
      <header className="bg-admin-header border-b border-admin-border">
        <div className="px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-admin-sidebar-text">Gerenciar Assinaturas</h1>
          <Button onClick={openCreateDialog} className="bg-admin-primary hover:bg-admin-button-hover text-admin-primary-foreground">
            <Plus className="h-4 w-4 mr-2" />
            Nova Assinatura
          </Button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-admin-card border-admin-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-admin-muted-foreground">Total de Assinaturas</CardTitle>
            <Users className="h-4 w-4 text-admin-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-admin-table-text">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="bg-admin-card border-admin-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-admin-muted-foreground">Assinaturas Ativas</CardTitle>
            <CalendarDays className="h-4 w-4 text-admin-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-admin-success">{stats.active}</div>
          </CardContent>
        </Card>

        <Card className="bg-admin-card border-admin-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-admin-muted-foreground">Receita Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-admin-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-admin-success">R$ {stats.revenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="px-6 pb-6 flex gap-4">
        <div className="flex-1">
          <Input placeholder="Buscar por usuário ou plano..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-admin-content-bg border-admin-border text-admin-table-text" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-admin-content-bg border-admin-border text-admin-table-text">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
            <SelectItem value="expired">Expirado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Subscriptions Table */}
      <div className="px-6 pb-6">
        <Card className="bg-admin-card border-admin-border">
          <Table>
            <TableHeader>
              <TableRow className="border-admin-border">
                <TableHead className="text-admin-muted-foreground">Usuário</TableHead>
                <TableHead className="text-admin-muted-foreground">Plano</TableHead>
                <TableHead className="text-admin-muted-foreground">Status</TableHead>
                <TableHead className="text-admin-muted-foreground">Início</TableHead>
                <TableHead className="text-admin-muted-foreground">Fim</TableHead>
                <TableHead className="text-admin-muted-foreground">Preço</TableHead>
                <TableHead className="text-admin-muted-foreground">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.map(subscription => <TableRow key={subscription.id} className="border-admin-border">
                  <TableCell className="text-admin-table-text">
                    <div>
                      <div className="font-medium">{subscription.profiles?.name}</div>
                      <div className="text-sm text-admin-muted-foreground">{subscription.profiles?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-admin-table-text">{subscription.plans?.name}</TableCell>
                  <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                  <TableCell className="text-admin-table-text">{formatDate(subscription.start_date)}</TableCell>
                  <TableCell className="text-admin-table-text">
                    {subscription.end_date ? formatDate(subscription.end_date) : '-'}
                  </TableCell>
                  <TableCell className="text-admin-table-text">
                    R$ {subscription.plans?.price?.toFixed(2)} / {subscription.plans?.billing_cycle}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(subscription)} className="text-gray-400 hover:text-white hover:bg-gray-800">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(subscription.id)} className="text-red-400 hover:text-red-300 hover:bg-gray-800">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-admin-content-bg border-admin-border">
          <DialogHeader>
            <DialogTitle className="text-admin-sidebar-text">
              {editingSubscription ? 'Editar Assinatura' : 'Nova Assinatura'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-admin-table-text">Usuário *</Label>
              <Select value={formData.user_id} onValueChange={value => setFormData({
                ...formData,
                user_id: value
              })}>
                <SelectTrigger className="bg-admin-content-bg border-admin-border text-admin-table-text">
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-admin-table-text">Plano *</Label>
              <Select value={formData.plan_id} onValueChange={value => setFormData({
                ...formData,
                plan_id: value
              })}>
                <SelectTrigger className="bg-admin-content-bg border-admin-border text-admin-table-text">
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map(plan => <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - R$ {plan.price} / {plan.billing_cycle}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-admin-table-text">Status</Label>
              <Select value={formData.status} onValueChange={value => setFormData({
                ...formData,
                status: value
              })}>
                <SelectTrigger className="bg-admin-content-bg border-admin-border text-admin-table-text">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="expired">Expirado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-admin-table-text">Data de Início</Label>
              <Input type="date" value={formData.start_date} onChange={e => setFormData({
                ...formData,
                start_date: e.target.value
              })} className="bg-admin-content-bg border-admin-border text-admin-table-text" required />
            </div>

            <div>
              <Label className="text-admin-table-text">Data de Fim (opcional)</Label>
              <Input type="date" value={formData.end_date} onChange={e => setFormData({
                ...formData,
                end_date: e.target.value
              })} className="bg-admin-content-bg border-admin-border text-admin-table-text" />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-gray-600 text-zinc-950">
                Cancelar
              </Button>
              <Button type="submit" className="bg-admin-primary hover:bg-admin-button-hover text-admin-primary-foreground">
                {editingSubscription ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      </>}
    </>;
};

export default AdminSubscriptions;
