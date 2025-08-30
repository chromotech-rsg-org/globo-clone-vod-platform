import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Edit, Trash2, Plus, Save, X, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Package {
  id: string;
  name: string;
  code: string;
  vendor_id: string | null;
  active: boolean | null;
  suspension_package: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

const AdminPackages = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<Package | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const {
    toast
  } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    vendor_id: '',
    active: true,
    suspension_package: false
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('packages').select('*').order('name', {
        ascending: true
      });
      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Erro ao buscar pacotes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os pacotes",
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
      if (!formData.code.trim()) {
        throw new Error('Código é obrigatório');
      }
      const packageData = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        vendor_id: formData.vendor_id.trim() || null,
        active: formData.active,
        suspension_package: formData.suspension_package
      };
      if (editingItem) {
        // Update existing
        const {
          error
        } = await supabase.from('packages').update(packageData).eq('id', editingItem.id);
        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Pacote atualizado com sucesso"
        });
      } else {
        // Create new
        const {
          error
        } = await supabase.from('packages').insert([packageData]);
        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Pacote criado com sucesso"
        });
      }
      await fetchPackages();
      resetForm();
    } catch (error: any) {
      let errorMessage = "Não foi possível salvar o pacote";
      if (error.message === 'Usuário não autenticado') {
        errorMessage = "Você precisa estar logado para realizar esta ação";
      } else if (error.message.includes('obrigatório')) {
        errorMessage = error.message;
      } else if (error.code === '23505') {
        errorMessage = "Já existe um pacote com este código";
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
    if (!confirm('Tem certeza que deseja excluir este pacote?')) return;
    try {
      const {
        error
      } = await supabase.from('packages').delete().eq('id', id);
      if (error) throw error;
      toast({
        title: "Sucesso",
        description: "Pacote excluído com sucesso"
      });
      fetchPackages();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o pacote",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (item: Package) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      code: item.code,
      vendor_id: item.vendor_id || '',
      active: item.active || false,
      suspension_package: item.suspension_package || false
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
      code: '',
      vendor_id: '',
      active: true,
      suspension_package: false
    });
  };

  const filteredPackages = packages.filter(pkg => pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) || pkg.code.toLowerCase().includes(searchTerm.toLowerCase()));

  return <>
    {loading ? <div className="p-6">
        <div className="text-admin-table-text">Carregando...</div>
      </div> : <>
      <header className="bg-admin-header border-b border-admin-border">
        <div className="px-6 py-4">
          <h1 className="text-xl font-bold text-admin-sidebar-text">Gerenciar Pacotes</h1>
        </div>
      </header>

      <div className="p-6">
        {/* Search and Create */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input placeholder="Buscar pacotes..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-admin-content-bg border-admin-border text-admin-table-text" />
          </div>
          
          <Button onClick={handleCreate} variant="admin">
            <Plus className="h-4 w-4 mr-2" />
            Novo Pacote
          </Button>
        </div>

        {/* Packages Table */}
        <Card className="bg-admin-card border-admin-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-admin-border">
                  <TableHead className="text-admin-muted-foreground">Nome</TableHead>
                  <TableHead className="text-admin-muted-foreground">Código</TableHead>
                  <TableHead className="text-admin-muted-foreground">Vendor ID</TableHead>
                  <TableHead className="text-admin-muted-foreground">Status</TableHead>
                  <TableHead className="text-admin-muted-foreground">Suspensão</TableHead>
                  <TableHead className="text-admin-muted-foreground">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPackages.map(pkg => <TableRow key={pkg.id} className="border-admin-border">
                    <TableCell className="text-admin-table-text">{pkg.name}</TableCell>
                    <TableCell className="text-admin-table-text">{pkg.code}</TableCell>
                    <TableCell className="text-admin-table-text">{pkg.vendor_id || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={pkg.active ? 'admin-success' : 'admin-muted'}>
                        {pkg.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={pkg.suspension_package ? 'admin-danger' : 'outline'} className={!pkg.suspension_package ? 'text-admin-table-text' : ''}>
                        {pkg.suspension_package ? 'Sim' : 'Não'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(pkg)} className="text-admin-muted-foreground hover:text-white hover:bg-gray-800">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(pkg.id)} className="text-red-400 hover:text-red-300 hover:bg-gray-800">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {filteredPackages.length === 0 && <Card className="bg-admin-card border-admin-border mt-6">
            <CardContent className="p-12 text-center">
              <p className="text-admin-muted-foreground">Nenhum pacote encontrado</p>
            </CardContent>
          </Card>}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-admin-content-bg border-admin-border text-admin-table-text">
          <DialogHeader>
            <DialogTitle className="text-admin-sidebar-text">
              {editingItem ? 'Editar Pacote' : 'Novo Pacote'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-admin-table-text">Nome</Label>
              <Input id="name" value={formData.name} onChange={e => setFormData({
                ...formData,
                name: e.target.value
              })} className="bg-admin-content-bg border-admin-border text-admin-table-text" placeholder="Nome do pacote" />
            </div>

            <div>
              <Label htmlFor="code" className="text-admin-table-text">Código</Label>
              <Input id="code" value={formData.code} onChange={e => setFormData({
                ...formData,
                code: e.target.value
              })} className="bg-admin-content-bg border-admin-border text-admin-table-text" placeholder="Código único do pacote" />
            </div>

            <div>
              <Label htmlFor="vendor_id" className="text-admin-table-text">Vendor ID</Label>
              <Input id="vendor_id" value={formData.vendor_id} onChange={e => setFormData({
                ...formData,
                vendor_id: e.target.value
              })} className="bg-admin-content-bg border-admin-border text-admin-table-text" placeholder="ID do fornecedor (opcional)" />
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="active" checked={formData.active} onCheckedChange={checked => setFormData({
                ...formData,
                active: checked
              })} />
              <Label htmlFor="active" className="text-admin-table-text">Ativo</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="suspension_package" checked={formData.suspension_package} onCheckedChange={checked => setFormData({
                ...formData,
                suspension_package: checked
              })} />
              <Label htmlFor="suspension_package" className="text-admin-table-text">Pacote de Suspensão</Label>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button onClick={handleSave} variant="admin" className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
              <Button onClick={resetForm} variant="outline" className="border-admin-border text-admin-table-text text-zinc-950">
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </>}
    </>;
};

export default AdminPackages;
