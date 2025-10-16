import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCustomizations } from '@/hooks/useCustomizations';
import { formatCpf, formatPhone } from '@/utils/formatters';
import { useAuth } from '@/contexts/AuthContext';

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
    confirmPassword: '',
    motv_user_id: user?.motv_user_id || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const { customizations } = useCustomizations('home');
  const projectName = customizations['global_global_site_name'] || 'MOTV';
  const isDeveloper = currentUser?.role === 'desenvolvedor';

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
        confirmPassword: '',
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

    if (!user && formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive"
      });
      return;
    }

    await processUserCreation();
  };

  const processUserCreation = async () => {
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

        // Sync with MOTV if user has motv_user_id
        if (user.motv_user_id) {
          try {
            const { MotvApiService } = await import('@/services/motvApiService');
            const names = formData.name.trim().split(' ');
            await MotvApiService.customerUpdate(parseInt(user.motv_user_id), {
              email: formData.email.trim(),
              profileName: formData.name.trim(),
              firstname: names[0],
              lastname: names.slice(1).join(' '),
              phone: formData.phone.trim()
            });
          } catch (motvError) {
            console.warn('MOTV update failed:', motvError);
          }
        }

        toast({
          title: "Sucesso",
          description: "Usuário atualizado com sucesso"
        });
      } else {
        // Criar novo usuário via Edge Function (usa service role com segurança)
        const { data: registerData, error: registerError } = await supabase.functions.invoke('auth-register', {
          body: {
            email: formData.email.trim(),
            password: formData.password,
            name: formData.name.trim(),
            cpf: formData.cpf.trim() || null,
            phone: formData.phone.trim() || null
          }
        });

        if (registerError) throw registerError;
        if (!registerData?.success || !registerData?.user_id) {
          throw new Error(registerData?.error || 'Falha ao criar usuário');
        }

        const newUserId = registerData.user_id as string;

        // Aplicar a função/role escolhida (edge cria como 'user' por padrão)
        if (formData.role && formData.role !== 'user') {
          const { error: roleError } = await supabase
            .from('profiles')
            .update({ role: formData.role })
            .eq('id', newUserId);
          if (roleError) throw roleError;
        }

        // Criar usuário no MOTV SEM pacote/plano
        try {
          const { data: motvResult, error: motvError } = await supabase.functions.invoke('motv-proxy', {
            body: {
              op: 'createCustomer',
              payload: {
                name: formData.name.trim(),
                login: formData.email.trim(),
                password: formData.password,
                email: formData.email.trim(),
                cpf: formData.cpf.trim().replace(/\D/g, ''),
                phone: formData.phone.trim().replace(/\D/g, '')
              }
            }
          });

          if (motvError) {
            console.error('[UserFormDialog] Erro ao criar no MOTV:', motvError);
          } else if (motvResult?.result?.status === 1) {
            const viewersId = motvResult.result.data?.viewers_id ?? motvResult.result.response;
            if (viewersId) {
              await supabase
                .from('profiles')
                .update({ motv_user_id: String(viewersId) })
                .eq('id', newUserId);
              console.log('[UserFormDialog] Usuário criado no MOTV:', viewersId);
            }
          } else {
            console.warn('[UserFormDialog] Falha ao criar no MOTV:', motvResult?.result?.message);
          }
        } catch (motvError) {
          console.warn('[UserFormDialog] Erro ao criar no MOTV:', motvError);
          // Não bloqueia o cadastro
        }

        toast({
          title: 'Sucesso',
          description: 'Usuário criado com sucesso'
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
        confirmPassword: '',
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
              onChange={(e) => setFormData(prev => ({ ...prev, cpf: formatCpf(e.target.value) }))}
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
              onChange={(e) => setFormData(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
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
                {isDeveloper && (
                  <SelectItem value="desenvolvedor">Desenvolvedor</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {!user && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">Senha *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite a senha"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="bg-black border-gray-700 text-white placeholder:text-gray-500"
                  disabled={isLoading}
                  minLength={6}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-300">Confirmar Senha *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Digite a senha novamente"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="bg-black border-gray-700 text-white placeholder:text-gray-500"
                  disabled={isLoading}
                  minLength={6}
                  required
                />
                <p className="text-xs text-gray-400">
                  Esta senha será usada tanto no sistema quanto no {projectName}
                </p>
              </div>
            </>
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