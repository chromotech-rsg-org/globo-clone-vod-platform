
import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCustomizations } from '@/hooks/useCustomizations';
import { formatBillingCycle } from '@/utils/formatters';

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string | null;
  benefits: string[] | null;
  best_seller: boolean | null;
  billing_cycle: string | null;
  free_days: number | null;
  active: boolean | null;
}

const PlansSection = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeCycle, setActiveCycle] = useState<string>('monthly');
  const [loading, setLoading] = useState(true);
  const { getCustomization } = useCustomizations('home');

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
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, cycle: string | null) => {
    const formattedPrice = price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
    
    return cycle === 'annually' ? `${formattedPrice}/ano` : `${formattedPrice}/mês`;
  };

  const getCycleLabel = (cycle: string) => {
    switch (cycle) {
      case 'monthly':
        return 'Mensal';
      case 'annually':
        return 'Anual';
      default:
        return cycle;
    }
  };

  const filteredPlans = plans.filter(plan => plan.billing_cycle === activeCycle);
  const availableCycles = [...new Set(plans.map(plan => plan.billing_cycle))].filter(Boolean);

  if (loading) {
    return (
      <section id="plans" className="py-20 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">Carregando planos...</div>
        </div>
      </section>
    );
  }

  if (plans.length === 0) {
    return (
      <section id="plans" className="py-20 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {getCustomization('plans', 'title', 'Escolha seu Plano')}
            </h2>
            <p className="text-xl text-gray-400 mb-12">
              {getCustomization('plans', 'subtitle', 'Nenhum plano disponível no momento')}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const sectionBgColor = getCustomization('plans', 'plans_background_color', '#1f2937');
  const popularBorderColor = getCustomization('plans', 'plans_border_color', '#3b82f6');
  const popularBadgeBg = getCustomization('plans', 'plans_badge_background', '#3b82f6');
  const popularBadgeText = getCustomization('plans', 'plans_badge_text_color', '#ffffff');
  const planCardBgColor = getCustomization('plans', 'plans_card_background_color', '#111827');

  return (
    <section 
      id="plans" 
      className="py-20"
      style={{ backgroundColor: sectionBgColor }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {getCustomization('plans', 'title', 'Escolha seu Plano')}
          </h2>
          <p className="text-xl text-gray-400">
            {getCustomization('plans', 'subtitle', 'Acesso ilimitado ao melhor do entretenimento')}
          </p>
        </div>

        {/* Billing Cycle Tabs */}
        {availableCycles.length > 1 && (
          <div className="flex justify-center mb-8">
            <div className="bg-gray-700 rounded-lg p-1 flex">
              {availableCycles.map((cycle) => (
                <button
                  key={cycle}
                  onClick={() => setActiveCycle(cycle)}
                  className={`px-6 py-2 rounded-md font-medium transition-colors ${
                    activeCycle === cycle
                      ? 'bg-white text-gray-900'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {getCycleLabel(cycle)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {filteredPlans.map((plan) => (
            <div 
              key={plan.id}
              className="rounded-xl p-8 relative flex flex-col"
              style={{
                backgroundColor: planCardBgColor,
                border: plan.best_seller 
                  ? `2px solid ${popularBorderColor}` 
                  : '1px solid #374151'
              }}
            >
              {plan.best_seller && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span 
                    className="px-4 py-1 rounded-full text-sm font-medium"
                    style={{ 
                      backgroundColor: popularBadgeBg,
                      color: popularBadgeText
                    }}
                  >
                    {getCustomization('plans', 'plans_badge_text', 'Mais Popular')}
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                {plan.description && (
                  <p className="text-gray-400 mb-4">{plan.description}</p>
                )}
                <div className="text-4xl font-bold text-white mb-2">
                  {formatPrice(plan.price, plan.billing_cycle)}
                </div>
                {plan.free_days && plan.free_days > 0 && (
                  <p className="text-blue-400 text-sm">
                    {plan.free_days} dias grátis
                  </p>
                )}
              </div>

              {plan.benefits && plan.benefits.length > 0 && (
                <ul className="space-y-4 mb-8 flex-grow">
                  {plan.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center text-gray-300">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-auto">
                <Link
                  to="/checkout"
                  state={{ selectedPlan: plan.id }}
                  className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition-colors ${
                    plan.best_seller
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  Escolher Plano
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlansSection;
