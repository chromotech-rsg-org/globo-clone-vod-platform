
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Subscription {
  id: string;
  user_id: string;
  plan_id?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  profiles?: {
    name: string;
    email: string;
  };
  plans?: {
    name: string;
  };
}

interface Plan {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface SubscriptionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription?: Subscription;
  preSelectedUserId?: string; // Add support for pre-selecting user
  onSuccess: () => void;
}

const SubscriptionFormDialog: React.FC<SubscriptionFormDialogProps> = ({
  open,
  onOpenChange,
  subscription,
  preSelectedUserId, // Add the new parameter
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [formData, setFormData] = useState({
    user_id: '',
    plan_id: '',
    status: 'active',
    start_date: '',
    end_date: '',
    motv_password: '', // New field for MOTV password
  });
  const { toast } = useToast();

  const isEditing = !!subscription;

  // Separate effect for loading data when dialog opens
  useEffect(() => {
    if (open) {
      fetchUsers();
      fetchPlans();
    }
  }, [open]);

  // Separate effect for setting form data after data is loaded
  useEffect(() => {
    if (open && users.length > 0 && plans.length > 0) {
      if (subscription) {
        // Editing mode - load subscription data
        setFormData({
          user_id: subscription.user_id,
          plan_id: subscription.plan_id || '',
          status: subscription.status,
          start_date: subscription.start_date ? new Date(subscription.start_date).toISOString().split('T')[0] : '',
          end_date: subscription.end_date ? new Date(subscription.end_date).toISOString().split('T')[0] : '',
          motv_password: '', // Reset password field on edit
        });
      } else {
        // New subscription mode - use preSelectedUserId if provided
        setFormData({
          user_id: preSelectedUserId || '',
          plan_id: '',
          status: 'active',
          start_date: new Date().toISOString().split('T')[0],
          end_date: '',
          motv_password: '', // Empty for new subscription
        });
      }
    }
  }, [open, subscription, preSelectedUserId, users.length, plans.length]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .order('name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('id, name')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.user_id || !formData.plan_id) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um usuário e um plano",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const submitData = {
        user_id: formData.user_id,
        plan_id: formData.plan_id,
        status: formData.status,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      let subscriptionId: string;

      if (isEditing) {
        // Verificar se o plano mudou
        const planChanged = subscription.plan_id !== formData.plan_id;
        // Verificar se o status mudou para canceled
        const statusChangedToCanceled = subscription.status !== 'canceled' && formData.status === 'canceled';

        const { error } = await supabase
          .from('subscriptions')
          .update(submitData)
          .eq('id', subscription.id);

        if (error) throw error;
        subscriptionId = subscription.id;

        // Se o plano mudou, atualizar na MOTV
        if (planChanged && formData.plan_id) {
          try {
            const { MotvPlanManager } = await import('@/services/motvPlanManager');
            await MotvPlanManager.changePlan(formData.user_id, formData.plan_id);
            console.log('Plano trocado na MOTV com sucesso');
          } catch (motvError) {
            console.error('Erro ao trocar plano na MOTV:', motvError);
            toast({
              title: "Atenção",
              description: "Assinatura atualizada, mas houve erro ao sincronizar com MOTV",
              variant: "destructive"
            });
          }
        }
        
        // Se o status mudou para canceled, cancelar na MOTV
        if (statusChangedToCanceled) {
          try {
            const { MotvPlanManager } = await import('@/services/motvPlanManager');
            await MotvPlanManager.cancelPlan(formData.user_id);
            console.log('Plano cancelado na MOTV com sucesso');
          } catch (motvError) {
            console.error('Erro ao cancelar plano na MOTV:', motvError);
            toast({
              title: "Atenção",
              description: "Assinatura cancelada, mas houve erro ao sincronizar com MOTV",
              variant: "destructive"
            });
          }
        }

        toast({
          title: "Sucesso",
          description: "Assinatura atualizada com sucesso"
        });
      } else {
        // Criar nova assinatura
        const { data: newSubscription, error } = await supabase
          .from('subscriptions')
          .insert([submitData])
          .select()
          .single();

        if (error) throw error;
        subscriptionId = newSubscription.id;

        // MOTV Integration: Check if user exists in MOTV, create if not, then apply plan
        try {
          console.log('🔄 [SubscriptionFormDialog] Checking MOTV user existence...');
          
          // Get user profile with motv_user_id
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('motv_user_id, name, email, cpf, phone')
            .eq('id', formData.user_id)
            .single();

          if (profileError) throw profileError;

          let finalMotvUserId = profile.motv_user_id;

          // If user doesn't have motv_user_id, create user in MOTV first
          if (!finalMotvUserId) {
            console.log('⚠️ [SubscriptionFormDialog] User has no motv_user_id, creating in MOTV...');
            
            // Use provided password, fallback to CPF, then email prefix
            const cleanCpf = profile.cpf ? profile.cpf.replace(/\D/g, '') : '';
            const motvPassword = formData.motv_password || cleanCpf || profile.email.split('@')[0];
            
            if (!formData.motv_password) {
              console.log('⚠️ [SubscriptionFormDialog] No password provided, using fallback:', cleanCpf ? 'CPF' : 'email prefix');
            }
            
            const { data: createResult, error: createError } = await supabase.functions.invoke('motv-proxy', {
              body: {
                op: 'createCustomer',
                payload: {
                  name: profile.name,
                  login: profile.email,
                  password: motvPassword,
                  email: profile.email,
                  cpf: cleanCpf,
                  phone: profile.phone ? profile.phone.replace(/\D/g, '') : ''
                }
              }
            });

            if (createError) {
              console.error('❌ [SubscriptionFormDialog] Edge function error:', createError);
              throw new Error('Erro ao criar usuário na MOTV: ' + createError.message);
            }

            console.log('🔍 [SubscriptionFormDialog] MOTV response:', createResult);

            // Validar se a resposta tem a estrutura esperada
            if (!createResult || typeof createResult !== 'object') {
              throw new Error('Resposta inválida da MOTV');
            }

            const result = createResult.result;
            console.log('🔍 [SubscriptionFormDialog] Result object:', result);

            // Validar status
            const rawStatus = result?.status || result?.code;
            const status = typeof rawStatus === 'number' ? rawStatus : (rawStatus ? parseInt(String(rawStatus)) : NaN);
            
            if (isNaN(status)) {
              console.error('❌ [SubscriptionFormDialog] Invalid status from MOTV:', { rawStatus, result });
              throw new Error('Resposta inválida da MOTV: status não encontrado');
            }
            
            console.log('📊 [SubscriptionFormDialog] Parsed status:', status);

            if (status === 1) {
              // Sucesso - buscar viewers_id
              const rawId = result?.data?.viewers_id ?? result?.response ?? result?.viewers_id ?? result?.data?.response;
              
              if (!rawId) {
                console.error('❌ [SubscriptionFormDialog] No viewers_id in response:', result);
                throw new Error('Usuário criado mas ID não retornado pela MOTV');
              }

              finalMotvUserId = String(rawId);
              const { error: updateError } = await supabase
                .from('profiles')
                .update({ motv_user_id: finalMotvUserId })
                .eq('id', formData.user_id);

              if (updateError) {
                console.error('⚠️ Failed to update profile with motv_user_id:', updateError);
                throw new Error('Erro ao salvar ID MOTV no perfil');
              }
              
              console.log('✅ [SubscriptionFormDialog] User created in MOTV with ID:', finalMotvUserId);
            } else if (status === 104 || status === 106) {
              // User already exists in MOTV (código 104 ou 106)
              console.log('ℹ️ [SubscriptionFormDialog] User already exists in MOTV (code ' + status + ')');
              
              // Verify if password was provided
              if (!formData.motv_password) {
                throw new Error('Este usuário já existe na MOTV. Por favor, informe a senha MOTV do usuário no campo "Senha MOTV".');
              }
              
              // Try to authenticate with provided password
              console.log('🔐 [SubscriptionFormDialog] Attempting authentication with provided password...');
              try {
                const { data: authResult, error: authError } = await supabase.functions.invoke('motv-proxy', {
                  body: {
                    op: 'apiLogin',
                    payload: {
                      login: profile.email,
                      password: formData.motv_password
                    }
                  }
                });

                if (authError) {
                  throw new Error('Erro ao autenticar: ' + authError.message);
                }

                const authData = authResult?.result;
                const authStatus = authData?.status || authData?.code;
                
                if (authStatus === 1 && authData?.data?.viewers_id) {
                  // Authentication successful - got viewers_id
                  finalMotvUserId = String(authData.data.viewers_id);
                  console.log('✅ [SubscriptionFormDialog] Authentication successful, got viewers_id:', finalMotvUserId);
                  
                  // Save to profile
                  await supabase
                    .from('profiles')
                    .update({ motv_user_id: finalMotvUserId })
                    .eq('id', formData.user_id);
                } else {
                  // Authentication failed - wrong password
                  console.error('❌ [SubscriptionFormDialog] Authentication failed:', authData);
                  
                  // Ask if user wants to update password
                  const updatePassword = confirm(
                    'A senha informada não corresponde à senha atual na MOTV.\n\n' +
                    'Deseja atualizar a senha MOTV do usuário com a senha informada?'
                  );
                  
                  if (!updatePassword) {
                    throw new Error('Senha incorreta. Operação cancelada.');
                  }
                  
                  // First, find the user to get viewers_id
                  console.log('🔍 [SubscriptionFormDialog] Finding user to update password...');
                  const { data: findResult, error: findError } = await supabase.functions.invoke('motv-proxy', {
                    body: {
                      op: 'findCustomer',
                      payload: {
                        email: profile.email
                      }
                    }
                  });

                  if (findError || !findResult?.result?.data?.viewers_id) {
                    throw new Error('Não foi possível localizar o usuário na MOTV para atualizar a senha.');
                  }

                  finalMotvUserId = String(findResult.result.data.viewers_id);
                  console.log('✅ [SubscriptionFormDialog] Found viewers_id:', finalMotvUserId);
                  
                  // Update password in MOTV
                  console.log('🔄 [SubscriptionFormDialog] Updating password in MOTV...');
                  const { data: updateResult, error: updateError } = await supabase.functions.invoke('motv-proxy', {
                    body: {
                      op: 'updateCustomer',
                      payload: {
                        viewers_id: parseInt(finalMotvUserId, 10),
                        password: formData.motv_password
                      }
                    }
                  });

                  if (updateError) {
                    throw new Error('Erro ao atualizar senha na MOTV: ' + updateError.message);
                  }

                  const updateData = updateResult?.result;
                  const updateStatus = updateData?.status || updateData?.code;
                  
                  if (updateStatus !== 1) {
                    throw new Error('Falha ao atualizar senha na MOTV: ' + (updateData?.message || 'Erro desconhecido'));
                  }
                  
                  console.log('✅ [SubscriptionFormDialog] Password updated successfully in MOTV');
                  
                  // Save viewers_id to profile
                  await supabase
                    .from('profiles')
                    .update({ motv_user_id: finalMotvUserId })
                    .eq('id', formData.user_id);
                  
                  toast({
                    title: "Senha atualizada",
                    description: "A senha MOTV foi atualizada com sucesso"
                  });
                }
              } catch (authErr: any) {
                console.error('❌ [SubscriptionFormDialog] Error during authentication/update:', authErr);
                throw new Error(authErr.message || 'Erro ao validar senha MOTV');
              }
            } else {
              const errorMsg = result?.message || result?.error_message || 'Status ' + status;
              throw new Error(`Erro ao criar usuário na MOTV: ${errorMsg}`);
            }
          } else {
            console.log('✅ [SubscriptionFormDialog] User already has motv_user_id:', finalMotvUserId);
          }

          // Verify we have a motv_user_id before applying plan
          if (!finalMotvUserId) {
            throw new Error('Não foi possível obter o ID MOTV do usuário');
          }

          console.log('🔄 [SubscriptionFormDialog] Applying plan with motv_user_id:', finalMotvUserId);

          const { MotvPlanManager } = await import('@/services/motvPlanManager');
          await MotvPlanManager.changePlan(formData.user_id, formData.plan_id);
          console.log('✅ [SubscriptionFormDialog] Plan applied successfully in MOTV');
          
          toast({
            title: "Sucesso",
            description: "Assinatura criada e pacote MOTV atribuído ao usuário"
          });
        } catch (motvError: any) {
          console.error('❌ [SubscriptionFormDialog] Error in MOTV integration:', motvError);
          toast({
            title: "Atenção",
            description: "Assinatura criada, mas houve erro ao sincronizar com MOTV: " + (motvError.message || 'Erro desconhecido'),
            variant: "destructive"
          });
        }
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao salvar assinatura:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar a assinatura",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-black text-white border-green-600/30">
        <DialogHeader>
          <DialogTitle className="text-white">
            {isEditing ? 'Editar Assinatura' : 'Nova Assinatura'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user_id" className="text-white">Usuário</Label>
            <Select 
              value={formData.user_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, user_id: value }))}
              disabled={isEditing}
            >
              <SelectTrigger className="bg-black border-green-600/30 text-white">
                <SelectValue placeholder="Selecione um usuário" />
              </SelectTrigger>
              <SelectContent className="bg-black border-green-600/30">
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id} className="text-white hover:bg-gray-800">
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan_id" className="text-white">Plano</Label>
            <Select 
              value={formData.plan_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, plan_id: value }))}
            >
              <SelectTrigger className="bg-black border-green-600/30 text-white">
                <SelectValue placeholder="Selecione um plano" />
              </SelectTrigger>
              <SelectContent className="bg-black border-green-600/30">
                {plans.map(plan => (
                  <SelectItem key={plan.id} value={plan.id} className="text-white hover:bg-gray-800">
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-white">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="bg-black border-green-600/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border-green-600/30">
                <SelectItem value="active" className="text-white hover:bg-gray-800">Ativo</SelectItem>
                <SelectItem value="inactive" className="text-white hover:bg-gray-800">Inativo</SelectItem>
                <SelectItem value="canceled" className="text-white hover:bg-gray-800">Cancelado</SelectItem>
                <SelectItem value="expired" className="text-white hover:bg-gray-800">Expirado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start_date" className="text-white">Data de Início</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              className="bg-black border-green-600/30 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end_date" className="text-white">Data de Término</Label>
            <Input
              id="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
              className="bg-black border-green-600/30 text-white"
            />
          </div>

          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="motv_password" className="text-white">
                Senha MOTV {formData.user_id && '(obrigatória se usuário já existe na MOTV)'}
              </Label>
              <Input
                id="motv_password"
                type="password"
                value={formData.motv_password}
                onChange={(e) => setFormData(prev => ({ ...prev, motv_password: e.target.value }))}
                placeholder="Digite a senha MOTV do usuário"
                className="bg-black border-green-600/30 text-white"
              />
              <p className="text-xs text-gray-400">
                • Se usuário não existe na MOTV: será criado com esta senha (ou CPF se vazio)<br />
                • Se usuário já existe na MOTV: será validada e pode ser atualizada se incorreta
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="text-white hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="admin"
              disabled={loading}
            >
              {loading ? 'Salvando...' : (isEditing ? 'Salvar' : 'Criar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionFormDialog;
