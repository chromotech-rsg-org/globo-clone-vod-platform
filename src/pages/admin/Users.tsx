import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Edit, Eye, Save, X, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import RoleChangeConfirmation from '@/components/auth/RoleChangeConfirmation';
import ErrorBoundary from '@/components/ErrorBoundary';
import { sanitizeInputSecure, validateEmailSecurity, validateCpfSecurity, validatePhoneSecurity, validateEmail, validateCPF, validatePhone } from '@/utils/validators';
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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [roleChangeConfirmation, setRoleChangeConfirmation] = useState<{
    isOpen: boolean;
    currentRole: string;
    newRole: string;
    userName: string;
    userId: string;
  }>({
    isOpen: false,
    currentRole: '',
    newRole: '',
    userName: '',
    userId: ''
  });
  const {
    toast
  } = useToast();
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
      } = await supabase.from('profiles').select(`
          id,
          name,
          email,
          cpf,
          phone,
          role,
          created_at
        `).order('created_at', {
        ascending: false
      });
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      setUsers(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar usuários:', error);
      let errorMessage = "Não foi possível carregar os usuários";
      if (error.message === 'Usuário não autenticado') {
        errorMessage = "Você precisa estar logado para acessar esta página";
      } else if (error.code === '42501') {
        errorMessage = "Você não tem permissão para acessar esta página";
      } else if (error.code === 'PGRST116') {
        errorMessage = "Nenhum dado encontrado";
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
  const handleCreate = () => {
    setFormData({
      name: '',
      email: '',
      cpf: '',
      phone: '',
      role: 'user'
    });
    setIsCreateDialogOpen(true);
  };
  const handleCreateSave = async () => {
    // Input validation
    const errors: string[] = [];
    if (!formData.name.trim()) {
      errors.push('Name is required');
    }
    const emailValidation = validateEmailSecurity(formData.email);
    if (!emailValidation.isValid) {
      errors.push(...emailValidation.errors);
    }
    if (formData.cpf) {
      const cpfValidation = validateCpfSecurity(formData.cpf);
      if (!cpfValidation.isValid) {
        errors.push(...cpfValidation.errors);
      }
    }
    if (formData.phone) {
      const phoneValidation = validatePhoneSecurity(formData.phone);
      if (!phoneValidation.isValid) {
        errors.push(...phoneValidation.errors);
      }
    }
    if (errors.length > 0) {
      toast({
        title: "Erro de validação",
        description: errors.join(', '),
        variant: "destructive"
      });
      return;
    }
    try {
      // Sanitize inputs
      const sanitizedData = {
        name: sanitizeInputSecure(formData.name),
        email: formData.email.toLowerCase().trim(),
        cpf: formData.cpf ? sanitizeInputSecure(formData.cpf) : '',
        phone: formData.phone ? sanitizeInputSecure(formData.phone) : '',
        role: formData.role
      };
      const userData = {
        id: crypto.randomUUID(),
        name: sanitizedData.name,
        email: sanitizedData.email,
        cpf: sanitizedData.cpf || null,
        phone: sanitizedData.phone || null,
        role: sanitizedData.role
      };
      const {
        error
      } = await supabase.from('profiles').insert(userData);
      if (error) throw error;

      // Log admin user creation for audit purposes
      console.log(`[SECURITY AUDIT] User created: ${sanitizedData.name} (${sanitizedData.email}) with role ${sanitizedData.role}`);
      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso"
      });
      await fetchUsers();
      resetCreateForm();
    } catch (error: any) {
      let errorMessage = "Não foi possível criar o usuário";
      if (error.message === 'Usuário não autenticado') {
        errorMessage = "Você precisa estar logado para realizar esta ação";
      } else if (error.message.includes('obrigatório')) {
        errorMessage = error.message;
      } else if (error.code === '23505') {
        errorMessage = "Já existe um usuário com este email";
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
  const handleSave = async () => {
    if (!editingUser) return;

    // Input validation
    const errors: string[] = [];
    if (!formData.name.trim()) {
      errors.push('Name is required');
    }
    if (!validateEmail(formData.email)) {
      errors.push('Please enter a valid email address');
    }
    if (formData.cpf && !validateCPF(formData.cpf)) {
      errors.push('Please enter a valid CPF');
    }
    if (formData.phone && !validatePhone(formData.phone)) {
      errors.push('Please enter a valid phone number');
    }
    if (errors.length > 0) {
      toast({
        title: "Erro de validação",
        description: errors.join(', '),
        variant: "destructive"
      });
      return;
    }

    // Check for role change - if role is changing, show confirmation
    if (formData.role !== editingUser.role) {
      setRoleChangeConfirmation({
        isOpen: true,
        currentRole: editingUser.role,
        newRole: formData.role,
        userName: editingUser.name,
        userId: editingUser.id
      });
      return;
    }

    // Proceed with update if no role change
    await performUserUpdate();
  };
  const performUserUpdate = async () => {
    if (!editingUser) return;
    try {
      // Sanitize inputs
      const sanitizedData = {
        name: sanitizeInputSecure(formData.name),
        email: formData.email.toLowerCase().trim(),
        cpf: formData.cpf ? sanitizeInputSecure(formData.cpf) : '',
        phone: formData.phone ? sanitizeInputSecure(formData.phone) : '',
        role: formData.role
      };
      const userData = {
        name: sanitizedData.name,
        email: sanitizedData.email,
        cpf: sanitizedData.cpf || null,
        phone: sanitizedData.phone || null,
        role: sanitizedData.role
      };
      const {
        error
      } = await supabase.from('profiles').update(userData).eq('id', editingUser.id);
      if (error) throw error;

      // Log role change for audit purposes
      if (formData.role !== editingUser.role) {
        console.log(`[SECURITY AUDIT] Role changed for user ${editingUser.name} (${editingUser.email}) from ${editingUser.role} to ${formData.role}`);
      }
      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso"
      });
      await fetchUsers();
      resetForm();
      setRoleChangeConfirmation(prev => ({
        ...prev,
        isOpen: false
      }));
    } catch (error: any) {
      let errorMessage = "Não foi possível atualizar o usuário";
      if (error.message === 'Usuário não autenticado') {
        errorMessage = "Você precisa estar logado para realizar esta ação";
      } else if (error.message.includes('obrigatório')) {
        errorMessage = error.message;
      } else if (error.code === '23505') {
        errorMessage = "Já existe um usuário com este email";
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
  const handleDelete = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
      return;
    }
    try {
      const {
        error
      } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw error;
      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso"
      });
      await fetchUsers();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o usuário",
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
  const resetCreateForm = () => {
    setIsCreateDialogOpen(false);
    setFormData({
      name: '',
      email: '',
      cpf: '',
      phone: '',
      role: 'user'
    });
  };
  const filteredUsers = users.filter(user => user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase()));
  if (loading) {
    return <div className="p-6">
        <div className="text-white">Carregando...</div>
      </div>;
  }
  return <>
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="px-6 py-4">
          <h1 className="text-xl font-bold text-white">Gerenciar Usuários</h1>
        </div>
      </header>

      <div className="p-6">
        {/* Search and Create */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardContent className="p-6">
            <div className="flex justify-between items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input placeholder="Buscar usuários por nome ou email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-gray-700 border-gray-600 text-white" />
              </div>
              <Button variant="admin" onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <div className="space-y-4">
          {filteredUsers.map(user => <Card key={user.id} className="bg-gray-800 border-gray-700">
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
                    <Button variant="outline" size="sm" onClick={() => handleView(user)} className="border-gray-600 text-slate-950">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(user)} className="border-gray-600 text-slate-950">
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button variant="destructive" size="sm" className="bg-black text-white hover:bg-gray-800" onClick={() => handleDelete(user.id)}>
                      Excluir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>)}
        </div>

        {filteredUsers.length === 0 && <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-12 text-center">
              <p className="text-gray-400">Nenhum usuário encontrado</p>
            </CardContent>
          </Card>}
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
              <Input id="name" value={formData.name} onChange={e => setFormData({
              ...formData,
              name: e.target.value
            })} className="bg-gray-700 border-gray-600 text-white" />
            </div>

            <div>
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input id="email" type="email" value={formData.email} onChange={e => setFormData({
              ...formData,
              email: e.target.value
            })} className="bg-gray-700 border-gray-600 text-white" />
            </div>

            <div>
              <Label htmlFor="cpf" className="text-gray-300">CPF</Label>
              <Input id="cpf" value={formData.cpf} onChange={e => setFormData({
              ...formData,
              cpf: e.target.value
            })} className="bg-gray-700 border-gray-600 text-white" placeholder="000.000.000-00" />
            </div>

            <div>
              <Label htmlFor="phone" className="text-gray-300">Telefone</Label>
              <Input id="phone" value={formData.phone} onChange={e => setFormData({
              ...formData,
              phone: e.target.value
            })} className="bg-gray-700 border-gray-600 text-white" placeholder="(11) 99999-9999" />
            </div>

            <div>
              <Label htmlFor="role" className="text-gray-300">Função</Label>
              <Select value={formData.role} onValueChange={value => setFormData({
              ...formData,
              role: value
            })}>
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
              <Button onClick={handleSave} variant="admin" className="flex-1">
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
          
          {viewingUser && <div className="space-y-4">
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
            </div>}
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Criar Usuário</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-name" className="text-gray-300">Nome</Label>
              <Input id="create-name" value={formData.name} onChange={e => setFormData({
              ...formData,
              name: e.target.value
            })} className="bg-gray-700 border-gray-600 text-white" placeholder="Nome completo" />
            </div>

            <div>
              <Label htmlFor="create-email" className="text-gray-300">Email</Label>
              <Input id="create-email" type="email" value={formData.email} onChange={e => setFormData({
              ...formData,
              email: e.target.value
            })} className="bg-gray-700 border-gray-600 text-white" placeholder="email@exemplo.com" />
            </div>

            <div>
              <Label htmlFor="create-cpf" className="text-gray-300">CPF</Label>
              <Input id="create-cpf" value={formData.cpf} onChange={e => setFormData({
              ...formData,
              cpf: e.target.value
            })} className="bg-gray-700 border-gray-600 text-white" placeholder="000.000.000-00" />
            </div>

            <div>
              <Label htmlFor="create-phone" className="text-gray-300">Telefone</Label>
              <Input id="create-phone" value={formData.phone} onChange={e => setFormData({
              ...formData,
              phone: e.target.value
            })} className="bg-gray-700 border-gray-600 text-white" placeholder="(11) 99999-9999" />
            </div>

            <div>
              <Label htmlFor="create-role" className="text-gray-300">Função</Label>
              <Select value={formData.role} onValueChange={value => setFormData({
              ...formData,
              role: value
            })}>
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
              <Button onClick={handleCreateSave} variant="admin" className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Criar
              </Button>
              <Button onClick={resetCreateForm} variant="outline" className="border-gray-600 text-gray-300">
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <RoleChangeConfirmation isOpen={roleChangeConfirmation.isOpen} onClose={() => setRoleChangeConfirmation(prev => ({
      ...prev,
      isOpen: false
    }))} onConfirm={performUserUpdate} currentRole={roleChangeConfirmation.currentRole} newRole={roleChangeConfirmation.newRole} userName={roleChangeConfirmation.userName} />
    </>;
};
export default AdminUsers;