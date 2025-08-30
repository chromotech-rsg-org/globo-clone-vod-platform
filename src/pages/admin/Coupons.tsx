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
import { Edit, Trash2, Plus, Save, X, Search, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Coupon {
  id: string;
  code: string;
  discount: number | null;
  active: boolean | null;
  expiration_date: string | null;
  created_at: string | null;
  updated_at: string | null;
}
const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<Coupon | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const {
    toast
  } = useToast();
  const [formData, setFormData] = useState({
    code: '',
    discount: 0,
    active: true,
    expiration_date: ''
  });
  useEffect(() => {
    fetchCoupons();
  }, []);
  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const {
        data,
        error
      } = await supabase.from('coupons').select('*').order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error('Erro ao buscar cupons:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os cupons",
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
      if (!formData.code.trim()) {
        throw new Error('Código é obrigatório');
      }
      if (!formData.discount || formData.discount <= 0) {
        throw new Error('Desconto deve ser maior que zero');
      }
      const couponData = {
        code: formData.code.trim(),
        discount: Number(formData.discount),
        active: formData.active,
        expiration_date: formData.expiration_date || null
      };
      if (editingItem) {
        // Update existing
        const {
          error
        } = await supabase.from('coupons').update(couponData).eq('id', editingItem.id);
        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Cupom atualizado com sucesso"
        });
      } else {
        // Create new
        const {
          error
        } = await supabase.from('coupons').insert([couponData]);
        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Cupom criado com sucesso"
        });
      }
      await fetchCoupons();
      resetForm();
    } catch (error: any) {
      let errorMessage = "Não foi possível salvar o cupom";
      if (error.message === 'Usuário não autenticado') {
        errorMessage = "Você precisa estar logado para realizar esta ação";
      } else if (error.message.includes('obrigatório')) {
        errorMessage = error.message;
      } else if (error.code === '23505') {
        errorMessage = "Já existe um cupom com este código";
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
    if (!confirm('Tem certeza que deseja excluir este cupom?')) return;
    try {
      const {
        error
      } = await supabase.from('coupons').delete().eq('id', id);
      if (error) throw error;
      toast({
        title: "Sucesso",
        description: "Cupom excluído com sucesso"
      });
      fetchCoupons();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o cupom",
        variant: "destructive"
      });
    }
  };
  const handleEdit = (item: Coupon) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      discount: item.discount || 0,
      active: item.active || false,
      expiration_date: item.expiration_date || ''
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
      code: '',
      discount: 0,
      active: true,
      expiration_date: ''
    });
  };
  const filteredCoupons = coupons.filter(coupon => coupon.code.toLowerCase().includes(searchTerm.toLowerCase()));
  if (loading) {
    return <div className="p-6">
        <div className="text-white">Carregando...</div>
      </div>;
  }
  return <>
      <header className="bg-black border-b border-green-600/30">
        <div className="px-6 py-4">
          <h1 className="text-xl font-bold text-white">Gerenciar Cupons</h1>
        </div>
      </header>

      <div className="p-6">
        {/* Search and Create */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input placeholder="Buscar cupons..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-black border-green-600/30 text-white" />
          </div>
          
          <Button onClick={handleCreate} variant="admin">
            <Plus className="h-4 w-4 mr-2" />
            Novo Cupom
          </Button>
        </div>

        {/* Coupons Table */}
        <Card className="bg-black border-green-600/30">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Código</TableHead>
                  <TableHead className="text-gray-300">Desconto (%)</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Expiração</TableHead>
                  <TableHead className="text-gray-300">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCoupons.map(coupon => <TableRow key={coupon.id} className="border-gray-700">
                    <TableCell className="text-white">{coupon.code}</TableCell>
                    <TableCell className="text-white">{coupon.discount?.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={coupon.active ? 'admin-success' : 'admin-muted'}>
                        {coupon.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white">{coupon.expiration_date ? new Date(coupon.expiration_date).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(coupon)} className="text-gray-400 hover:text-white hover:bg-gray-800">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(coupon.id)} className="text-red-400 hover:text-red-300 hover:bg-gray-800">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {filteredCoupons.length === 0 && <Card className="bg-black border-green-600/30 mt-6">
            <CardContent className="p-12 text-center">
              <p className="text-gray-400">Nenhum cupom encontrado</p>
            </CardContent>
          </Card>}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-black border-green-600/30 text-white">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar Cupom' : 'Novo Cupom'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="code" className="text-gray-300">Código</Label>
              <Input id="code" value={formData.code} onChange={e => setFormData({
                ...formData,
                code: e.target.value
              })} className="bg-black border-green-600/30 text-white" placeholder="Código do cupom" />
            </div>

            <div>
              <Label htmlFor="discount" className="text-gray-300">Desconto (%)</Label>
              <Input id="discount" type="number" step="0.01" value={formData.discount} onChange={e => setFormData({
                ...formData,
                discount: parseFloat(e.target.value) || 0
              })} className="bg-black border-green-600/30 text-white" placeholder="0.00" />
            </div>

            <div>
              <Label htmlFor="expiration_date" className="text-gray-300">Data de Expiração</Label>
              <Input type="date" id="expiration_date" value={formData.expiration_date} onChange={e => setFormData({
                ...formData,
                expiration_date: e.target.value
              })} className="bg-black border-green-600/30 text-white" />
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="active" checked={formData.active} onCheckedChange={checked => setFormData({
                ...formData,
                active: checked
              })} />
              <Label htmlFor="active" className="text-gray-300">Ativo</Label>
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
export default AdminCoupons;
