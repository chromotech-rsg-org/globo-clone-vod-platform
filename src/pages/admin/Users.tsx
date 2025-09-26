import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash2, Plus, Search, UserX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DataTablePagination from '@/components/admin/DataTablePagination';
import BulkActionsToolbar from '@/components/admin/BulkActionsToolbar';
import UserFormDialog from '@/components/admin/UserFormDialog';
import { useCustomizations } from '@/hooks/useCustomizations';

interface User {
  id: string;
  name: string;
  email: string;
  cpf?: string;
  phone?: string;
  role: string;
  motv_user_id?: string;
  created_at: string;
  updated_at: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const { customizations } = useCustomizations('home');

  const projectName = customizations['global_global_site_name'] || 'MOTV';

  const isDeveloper = currentUser?.role === 'desenvolvedor';

  useEffect(() => {
    fetchUsers();
    
    // Update agro6 user with motv_user_id if needed
    const updateAgro6User = async () => {
      try {
        const { data: agro6User } = await supabase
          .from('profiles')
          .select('*')
          .eq('name', 'agro6')
          .eq('email', 'agro5@agro5.com')
          .maybeSingle();
          
        if (agro6User && !agro6User.motv_user_id) {
          const { error } = await supabase
            .from('profiles')
            .update({ motv_user_id: '7073368', updated_at: new Date().toISOString() })
            .eq('id', agro6User.id);
          
          if (!error) {
            setTimeout(() => fetchUsers(), 500);
          }
        }
      } catch (error) {
        console.log('User agro6 update attempt:', error);
      }
    };
    
    updateAgro6User();
  }, [roleFilter, currentPage, pageSize, searchTerm, isDeveloper]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // If the current user is not a developer, exclude developer users
      if (!isDeveloper) {
        query = query.neq('role', 'desenvolvedor');
      }

      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await query
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      setUsers(data as User[] || []);
      setTotalItems(count || 0);
    } catch (error: any) {
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

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowUserDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;

      // Queue integration job for user deletion
      try {
        const { MotvIntegrationService } = await import('@/services/motvIntegration');
        await MotvIntegrationService.deleteUser(id);
      } catch (integrationError) {
        console.warn('Integration deletion failed:', integrationError);
        // Don't fail the main operation for integration errors
      }

      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso"
      });
      fetchUsers();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o usuário",
        variant: "destructive"
      });
    }
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setShowUserDialog(true);
  };

  const handleDialogClose = () => {
    setShowUserDialog(false);
    setSelectedUser(null);
  };

  const handleDialogSuccess = () => {
    fetchUsers();
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(users.map(user => user.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, userId]);
    } else {
      setSelectedIds(prev => prev.filter(id => id !== userId));
    }
  };

  const handleBulkDelete = async (userIds: string[]) => {
    if (!confirm(`Tem certeza que deseja excluir ${userIds.length} usuários?`)) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .in('id', userIds);
      
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: `${userIds.length} usuários excluídos com sucesso`
      });
      
      setSelectedIds([]);
      fetchUsers();
    } catch (error) {
      console.error('Erro ao excluir usuários:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir os usuários",
        variant: "destructive"
      });
    }
  };

  const bulkActions = [
    {
      key: 'delete',
      label: 'Excluir Selecionados',
      icon: Trash2,
      variant: 'destructive' as const,
      action: handleBulkDelete
    }
  ];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  if (loading) {
    return <div className="p-6">
      <div className="text-white">Carregando...</div>
    </div>;
  }

  return (
    <>
      <header className="bg-black border-b border-green-600/30">
        <div className="px-6 py-4">
          <h1 className="text-xl font-bold text-white">Gerenciar Usuários</h1>
        </div>
      </header>

      <div className="p-6">
        {/* Search and Create */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 bg-black border-green-600/30 text-white"
            />
          </div>
          <Button onClick={handleCreate} variant="admin">
            <Plus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
        </div>

        <div className="flex gap-4 mb-6">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-black border border-green-600/30 text-white rounded"
          >
            <option value="all">Todas as Funções</option>
            <option value="user">Usuário</option>
            <option value="admin">Administrador</option>
            {isDeveloper && <option value="desenvolvedor">Desenvolvedor</option>}
          </select>
        </div>

        {/* Users Table */}
        <BulkActionsToolbar
          selectedIds={selectedIds}
          totalSelected={selectedIds.length}
          onClearSelection={() => setSelectedIds([])}
          table="profiles"
          customActions={bulkActions}
          exportColumns={['name', 'email', 'role', 'cpf', 'phone', 'motv_user_id', 'created_at']}
          exportFileName={`usuarios_${new Date().toISOString().split('T')[0]}.csv`}
        />
        
        <Card className="bg-black border-green-600/30">
          <CardContent className="p-0">
            <Table>
               <TableHeader>
                 <TableRow className="border-gray-700">
                   <TableHead className="text-gray-300 w-12">
                     <Checkbox
                       checked={selectedIds.length === users.length && users.length > 0}
                       onCheckedChange={handleSelectAll}
                       className="border-gray-600"
                     />
                   </TableHead>
                   <TableHead className="text-gray-300">Nome</TableHead>
                   <TableHead className="text-gray-300">Email</TableHead>
                   <TableHead className="text-gray-300">Função</TableHead>
                   <TableHead className="text-gray-300">ID {projectName}</TableHead>
                   <TableHead className="text-gray-300">Ações</TableHead>
                 </TableRow>
               </TableHeader>
              <TableBody>
                {users
                  .filter(user => {
                    // Additional UI-level security: hide developer users from non-developers
                    if (user.role === 'desenvolvedor' && !isDeveloper) {
                      return false;
                    }
                    return true;
                  })
                  .map(user => (
                  <TableRow key={user.id} className="border-gray-700">
                    <TableCell className="w-12">
                      <Checkbox
                        checked={selectedIds.includes(user.id)}
                        onCheckedChange={(checked) => handleSelectOne(user.id, checked as boolean)}
                        className="border-gray-600"
                      />
                    </TableCell>
                     <TableCell className="text-white">{user.name}</TableCell>
                     <TableCell className="text-white">{user.email}</TableCell>
                     <TableCell>
                       <Badge variant={
                         user.role === 'admin' ? 'admin-success' :
                         user.role === 'desenvolvedor' ? 'admin-warning' :
                           'admin-muted'
                       }>
                         {user.role === 'admin' ? 'Administrador' : 
                          user.role === 'desenvolvedor' ? 'Desenvolvedor' : 'Usuário'}
                       </Badge>
                     </TableCell>
                     <TableCell className="text-white">
                        {user.motv_user_id ? (
                          <Badge variant="outline" className="text-xs font-mono text-green-400 border-green-500/30 bg-green-500/10">
                            {user.motv_user_id}
                          </Badge>
                       ) : (
                         <span className="text-gray-500">-</span>
                       )}
                     </TableCell>
                     <TableCell>
                       <div className="flex space-x-2">
                         <Button 
                           size="sm" 
                           variant="ghost" 
                           onClick={() => handleEdit(user)}
                           className="text-gray-400 hover:text-white hover:bg-gray-800"
                           title="Editar"
                         >
                           <Edit className="h-4 w-4" />
                         </Button>
                         <Button 
                           size="sm" 
                           variant="ghost" 
                           onClick={() => handleDelete(user.id)}
                           className="text-red-400 hover:text-red-300 hover:bg-gray-800"
                           title="Excluir"
                         >
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       </div>
                     </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <DataTablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              table="profiles"
              exportColumns={['name', 'email', 'role', 'cpf', 'phone', 'motv_user_id', 'created_at']}
              exportFileName={`usuarios_completo_${new Date().toISOString().split('T')[0]}.csv`}
            />
          </CardContent>
        </Card>

        {users.length === 0 && (
          <Card className="bg-black border-green-600/30 mt-6">
            <CardContent className="p-12 text-center">
              <p className="text-gray-400">Nenhum usuário encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>

      <UserFormDialog
        open={showUserDialog}
        onClose={handleDialogClose}
        user={selectedUser}
        onSuccess={handleDialogSuccess}
      />
    </>
  );
};

export default AdminUsers;
