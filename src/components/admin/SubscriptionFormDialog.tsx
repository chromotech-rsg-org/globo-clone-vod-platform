
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
        });
      } else {
        // New subscription mode - use preSelectedUserId if provided
        setFormData({
          user_id: preSelectedUserId || '',
          plan_id: '',
          status: 'active',
          start_date: new Date().toISOString().split('T')[0],
          end_date: '',
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

        // Atribuir plano na MOTV (isso cancela planos antigos e assina o novo)
        try {
          const { MotvPlanManager } = await import('@/services/motvPlanManager');
          await MotvPlanManager.changePlan(formData.user_id, formData.plan_id);
          console.log('✅ Pacote MOTV atribuído ao usuário com sucesso');
          
          toast({
            title: "Sucesso",
            description: "Assinatura criada e pacote MOTV atribuído ao usuário"
          });
        } catch (motvError) {
          console.error('❌ Erro ao atribuir plano na MOTV:', motvError);
          toast({
            title: "Atenção",
            description: "Assinatura criada, mas houve erro ao sincronizar com MOTV",
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
