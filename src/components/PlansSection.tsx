
import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Plan {
  id: string;
  name: string;
  price: number;
  billing_cycle: string;
  description: string;
  benefits: string[];
  best_seller: boolean;
  active: boolean;
}

const PlansSection = () => {
  const [billingCycle, setBillingCycle] = useState<'mensal' | 'anual'>('anual');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('active', true)
        .order('priority', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os planos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = (planId: string) => {
    navigate('/checkout', { state: { selectedPlan: planId, billingCycle } });
  };

  const formatPrice = (price: number, cycle: string) => {
    if (cycle === 'anual' && billingCycle === 'anual') {
      return {
        monthly: (price / 12).toFixed(2),
        total: price.toFixed(2)
      };
    }
    return {
      monthly: price.toFixed(2),
      total: (price * 12).toFixed(2)
    };
  };

  if (loading) {
    return (
      <section className="bg-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-white">Carregando planos...</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gray-800 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Combos Globoplay Plano Padrão com Anúncios
          </h2>
          <p className="text-gray-300 text-lg">
            O melhor catálogo de conteúdo para você!
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-gray-700 p-1 rounded-lg flex">
            <button
              onClick={() => setBillingCycle('mensal')}
              className={`px-6 py-2 rounded-md transition-colors ${
                billingCycle === 'mensal'
                  ? 'bg-gray-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingCycle('anual')}
              className={`px-6 py-2 rounded-md transition-colors ${
                billingCycle === 'anual'
                  ? 'bg-white text-gray-900 font-medium'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Anual
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const pricing = formatPrice(plan.price, plan.billing_cycle);
            
            return (
              <div
                key={plan.id}
                className={`bg-gray-700 rounded-lg p-6 ${
                  plan.best_seller ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="text-center mb-6">
                  <div className="text-white text-xl font-bold mb-2">globoplay</div>
                  <div className="bg-gray-600 text-white px-3 py-1 rounded text-sm font-bold mb-4">
                    {plan.name.toUpperCase()}
                  </div>
                  <div className="text-gray-300 text-sm mb-2">{plan.description}</div>
                  <div className="text-gray-300 text-sm mb-4">
                    {billingCycle === 'anual' ? 'Plano Anual' : 'Plano Mensal'}
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-white">
                      <span className="text-sm">
                        {billingCycle === 'anual' ? '12x' : '1x'}
                      </span>
                      <span className="text-2xl font-bold ml-1">
                        R$ {pricing.monthly}
                      </span>
                    </div>
                    <div className="text-gray-400 text-sm">
                      Total de R$ {pricing.total}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-md font-semibold mb-4 transition-colors"
                >
                  Assinar
                </button>

                <div className="space-y-2">
                  {plan.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-300">
                      <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {plans.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">Nenhum plano disponível no momento.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default PlansSection;
