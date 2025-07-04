
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Edit, Eye, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/AdminLayout';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  cpf: string | null;
  phone: string | null;
  role: string;
  created_at: string;
}

const AdminUsers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    role: 'user'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      cpf: user.cpf || '',
      phone: user.phone || '',
      role: user.role
    });
    setIsDialogOpen(true);
  };

  const handleView = (user: UserProfile) => {
    setViewingUser(user);
    setIsViewDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          email: formData.email,
          cpf: formData.cpf || null,
          phone: formData.phone || null,
          role: formData.role,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso"
      });

      fetchUsers();
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o usuário",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setEditingUser(null);
    setIsDialogOpen(false);
    setFormData({
      name: '',
      email: '',
      cpf: '',
      phone: '',
      role: 'user'
    });
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-white">Carregando...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="px-6 py-4">
          <h1 className="text-xl font-bold text-white">Gerenciar Usuários</h1>
        </div>
      </header>

      <div className="p-6">
        {/* Search */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar usuários por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <h3 className="text-lg font-semibold text-white">{user.name}</h3>
                      <Badge variant={user.role === 'admin' ? 'default' : user.role === 'desenvolvedor' ? 'destructive' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Email</p>
                        <p className="text-white">{user.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">CPF</p>
                        <p className="text-white">{user.cpf || 'Não informado'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Telefone</p>
                        <p className="text-white">{user.phone || 'Não informado'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Cadastrado em</p>
                        <p className="text-white">{new Date(user.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-gray-600 text-gray-300"
                      onClick={() => handleView(user)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-gray-600 text-gray-300"
                      onClick={() => handleEdit(user)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-12 text-center">
              <p className="text-gray-400">Nenhum usuário encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-gray-300">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div>
              <Label htmlFor="cpf" className="text-gray-300">CPF</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="000.000.000-00"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-gray-300">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <Label htmlFor="role" className="text-gray-300">Função</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="desenvolvedor">Desenvolvedor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button onClick={handleSave} className="bg-red-600 hover:bg-red-700 flex-1">
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
              <Button onClick={resetForm} variant="outline" className="border-gray-600 text-gray-300">
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
          </DialogHeader>
          
          {viewingUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">Nome</Label>
                  <p className="text-white">{viewingUser.name}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Email</Label>
                  <p className="text-white">{viewingUser.email}</p>
                </div>
                <div>
                  <Label className="text-gray-400">CPF</Label>
                  <p className="text-white">{viewingUser.cpf || 'Não informado'}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Telefone</Label>
                  <p className="text-white">{viewingUser.phone || 'Não informado'}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Função</Label>
                  <Badge variant={viewingUser.role === 'admin' ? 'default' : viewingUser.role === 'desenvolvedor' ? 'destructive' : 'secondary'}>
                    {viewingUser.role}
                  </Badge>
                </div>
                <div>
                  <Label className="text-gray-400">Cadastrado em</Label>
                  <p className="text-white">{new Date(viewingUser.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminUsers;
