import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCustomizations } from '@/hooks/useCustomizations';

interface User {
  id: string;
  name: string;
  email: string;
  cpf?: string;
  phone?: string;
  role: string;
  motv_user_id?: string;
}

interface UserFormDialogProps {
  open: boolean;
  onClose: () => void;
  user?: User | null;
  onSuccess: () => void;
}

const UserFormDialog = ({ open, onClose, user, onSuccess }: UserFormDialogProps) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    cpf: user?.cpf || '',
    phone: user?.phone || '',
    role: user?.role || 'user',
    password: '',
    motv_user_id: user?.motv_user_id || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { customizations } = useCustomizations('home');
  const projectName = customizations['global_global_site_name'] || 'MOTV';

  // Update form data when user prop changes
  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        cpf: user.cpf || '',
        phone: user.phone || '',
        role: user.role || 'user',
        password: '',
        motv_user_id: user.motv_user_id || ''
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      toast({
        title: "Erro",
        description: "Nome e email são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    if (!user && !formData.password.trim()) {
      toast({
        title: "Erro",
        description: "Senha é obrigatória para novos usuários",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);

      if (user) {
        // Editar usuário existente
        const { error } = await supabase
          .from('profiles')
          .update({
            name: formData.name.trim(),
            email: formData.email.trim(),
            cpf: formData.cpf.trim() || null,
            phone: formData.phone.trim() || null,
            role: formData.role,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (error) throw error;

        // Queue integration job for user update
        try {
          const { MotvIntegrationService } = await import('@/services/motvIntegration');
          await MotvIntegrationService.updateUser(user.id, {
            name: formData.name.trim(),
            email: formData.email.trim(),
            cpf: formData.cpf.trim(),
            phone: formData.phone.trim(),
            role: formData.role
          });
        } catch (integrationError) {
          console.warn('Integration update failed:', integrationError);
          // Don't fail the main operation for integration errors
        }

        toast({
          title: "Sucesso",
          description: "Usuário atualizado com sucesso"
        });
      } else {
        // Criar novo usuário
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: formData.email.trim(),
          password: formData.password,
          email_confirm: true,
          user_metadata: {
            name: formData.name.trim()
          }
        });

        if (authError) throw authError;

        if (authData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              name: formData.name.trim(),
              email: formData.email.trim(),
              cpf: formData.cpf.trim() || null,
              phone: formData.phone.trim() || null,
              role: formData.role
            });

          if (profileError) throw profileError;

          // Queue integration job for user creation
          try {
            const { MotvIntegrationService } = await import('@/services/motvIntegration');
            await MotvIntegrationService.createUser(authData.user.id, {
              name: formData.name.trim(),
              email: formData.email.trim(),
              cpf: formData.cpf.trim(),
              phone: formData.phone.trim(),
              role: formData.role
            });
          } catch (integrationError) {
            console.warn('Integration creation failed:', integrationError);
            // Don't fail the main operation for integration errors
          }
        }

        toast({
          title: "Sucesso",
          description: "Usuário criado com sucesso"
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o usuário",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        name: '',
        email: '',
        cpf: '',
        phone: '',
        role: 'user',
        password: '',
        motv_user_id: ''
      });
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-black border-green-600/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">
            {user ? 'Editar Usuário' : 'Novo Usuário'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-300">Nome *</Label>
            <Input
              id="name"
              type="text"
              placeholder="Nome completo"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="bg-black border-gray-700 text-white placeholder:text-gray-500"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@exemplo.com"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="bg-black border-gray-700 text-white placeholder:text-gray-500"
              disabled={isLoading || !!user}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf" className="text-gray-300">CPF</Label>
            <Input
              id="cpf"
              type="text"
              placeholder="000.000.000-00"
              value={formData.cpf}
              onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
              className="bg-black border-gray-700 text-white placeholder:text-gray-500"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-gray-300">Telefone</Label>
            <Input
              id="phone"
              type="text"
              placeholder="(00) 00000-0000"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="bg-black border-gray-700 text-white placeholder:text-gray-500"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-gray-300">Função</Label>
            <Select 
              value={formData.role} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
              disabled={isLoading}
            >
              <SelectTrigger className="bg-black border-gray-700 text-white">
                <SelectValue placeholder="Selecione uma função" />
              </SelectTrigger>
              <SelectContent className="bg-black border-gray-700">
                <SelectItem value="user">Usuário</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="desenvolvedor">Desenvolvedor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!user && (
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Senha *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Senha (mínimo 6 caracteres)"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="bg-black border-gray-700 text-white placeholder:text-gray-500"
                disabled={isLoading}
                minLength={6}
                required
              />
            </div>
          )}

          {user && user.motv_user_id && (
            <div className="space-y-2">
              <Label htmlFor="motv_user_id" className="text-gray-300">{`ID ${projectName}`}</Label>
              <Input
                id="motv_user_id"
                type="text"
                value={user.motv_user_id}
                className="bg-gray-800 border-gray-600 text-gray-400 cursor-not-allowed"
                disabled={true}
                readOnly
              />
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="border-gray-600 text-black bg-gray-200 hover:bg-gray-300"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="admin"
              disabled={isLoading}
            >
              {isLoading ? 'Salvando...' : user ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserFormDialog;