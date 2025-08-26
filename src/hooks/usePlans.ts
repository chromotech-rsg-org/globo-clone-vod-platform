
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  billing_cycle: string;
  payment_type: string;
  benefits: string[];
  best_seller: boolean;
  active: boolean;
  priority: number;
  free_days: number;
  package_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePlanData {
  name: string;
  description?: string;
  price: number;
  billing_cycle: string;
  payment_type: string;
  benefits?: string[];
  best_seller?: boolean;
  active?: boolean;
  priority?: number;
  free_days?: number;
  package_id?: string;
}

export const usePlans = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const plansQuery = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;
      return data as Plan[];
    }
  });

  const activePlansQuery = useQuery({
    queryKey: ['plans', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('active', true)
        .order('priority', { ascending: true });

      if (error) throw error;
      return data as Plan[];
    }
  });

  const createPlanMutation = useMutation({
    mutationFn: async (planData: CreatePlanData) => {
      const { data, error } = await supabase
        .from('plans')
        .insert(planData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast({
        title: "Sucesso",
        description: "Plano criado com sucesso"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível criar o plano",
        variant: "destructive"
      });
      console.error('Error creating plan:', error);
    }
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, ...planData }: Partial<Plan> & { id: string }) => {
      const { data, error } = await supabase
        .from('plans')
        .update(planData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast({
        title: "Sucesso",
        description: "Plano atualizado com sucesso"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o plano",
        variant: "destructive"
      });
      console.error('Error updating plan:', error);
    }
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast({
        title: "Sucesso",
        description: "Plano excluído com sucesso"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o plano",
        variant: "destructive"
      });
      console.error('Error deleting plan:', error);
    }
  });

  return {
    plans: plansQuery.data || [],
    activePlans: activePlansQuery.data || [],
    isLoading: plansQuery.isLoading,
    isError: plansQuery.isError,
    createPlan: createPlanMutation.mutate,
    updatePlan: updatePlanMutation.mutate,
    deletePlan: deletePlanMutation.mutate,
    isCreating: createPlanMutation.isPending,
    isUpdating: updatePlanMutation.isPending,
    isDeleting: deletePlanMutation.isPending
  };
};
