import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CreditCard, Package, AlertCircle } from 'lucide-react';
import { formatBillingCycle } from '@/utils/formatters';

interface Subscription {
  id: string;
  plan_id: string;
  status: string;
  start_date: string;
  end_date: string;
  plan: {
    name: string;
    price: number;
    billing_cycle: string;
    description?: string;
    benefits?: string[];
  };
}

const Subscription = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
    fetchAvailablePlans();
  }, [user]);

  const fetchSubscription = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plan:plans(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('active', true)
        .order('priority');

      if (error) throw error;
      setAvailablePlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', subscription.id);

      if (error) throw error;

      setSubscription({ ...subscription, status: 'cancelled' });
      toast({
        title: "Assinatura cancelada",
        description: "Sua assinatura foi cancelada com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao cancelar assinatura. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleUpgradePlan = async (newPlanId: string) => {
    if (!subscription) return;

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ plan_id: newPlanId })
        .eq('id', subscription.id);

      if (error) throw error;

      fetchSubscription();
      toast({
        title: "Plano atualizado",
        description: "Seu plano foi atualizado com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar plano. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleReactivateSubscription = async () => {
    if (!subscription) return;

    try {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          status: 'active',
          end_date: endDate.toISOString()
        })
        .eq('id', subscription.id);

      if (error) throw error;

      fetchSubscription();
      toast({
        title: "Assinatura reativada",
        description: "Sua assinatura foi reativada com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao reativar assinatura. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Minha Assinatura
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie sua assinatura e explore outros planos
        </p>
      </div>

      {subscription ? (
        <div className="space-y-6">
          {/* Current Subscription */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Package className="w-5 h-5" />
                  <span>Assinatura Atual</span>
                </CardTitle>
                <Badge variant={subscription.status === 'active' ? 'default' : 'destructive'}>
                  {subscription.status === 'active' ? 'Ativo' : 'Cancelado'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-lg">{subscription.plan.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {subscription.plan.description}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <CreditCard className="w-4 h-4" />
                    <span className="font-medium">
                      R$ {subscription.plan.price.toFixed(2)}
                    </span>
                    <span className="text-gray-500">
                      / {formatBillingCycle(subscription.plan.billing_cycle).toLowerCase()}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      Válido até: {new Date(subscription.end_date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>

              {subscription.plan.benefits && subscription.plan.benefits.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Benefícios:</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {subscription.plan.benefits.map((benefit, index) => (
                      <li key={index}>• {benefit}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex space-x-3">
                {subscription.status === 'active' ? (
                  <Button 
                    variant="destructive" 
                    onClick={handleCancelSubscription}
                  >
                    Cancelar Assinatura
                  </Button>
                ) : (
                  <Button onClick={handleReactivateSubscription}>
                    Reativar Assinatura
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Available Plans for Upgrade */}
          {subscription.status === 'active' && (
            <Card>
              <CardHeader>
                <CardTitle>Mudar de Plano</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availablePlans
                    .filter(plan => plan.id !== subscription.plan_id)
                    .map((plan) => (
                    <div key={plan.id} className="border rounded-lg p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold">{plan.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {plan.description}
                        </p>
                      </div>
                      <div className="text-lg font-bold">
                        R$ {plan.price.toFixed(2)}
                        <span className="text-sm font-normal text-gray-500 ml-1">
                          / {formatBillingCycle(plan.billing_cycle).toLowerCase()}
                        </span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleUpgradePlan(plan.id)}
                        className="w-full"
                      >
                        Mudar para este plano
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma assinatura ativa</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Você não possui uma assinatura ativa no momento.
            </p>
            <Button>
              Escolher um plano
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Subscription;