import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { formatBillingCycle } from '@/utils/formatters';
import { supabase } from '@/integrations/supabase/client';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  billing_cycle: string;
  description?: string;
  benefits?: string[];
}

interface CheckoutPlanStepProps {
  plan: Plan;
  onNext: () => void;
  onPlanChange: (newPlan: Plan) => void;
}

const CheckoutPlanStep = ({ plan, onNext, onPlanChange }: CheckoutPlanStepProps) => {
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [showOtherPlans, setShowOtherPlans] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAvailablePlans();
  }, []);

  const fetchAvailablePlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('active', true)
        .order('priority', { ascending: true });

      if (error) throw error;
      setAvailablePlans(data || []);
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (selectedPlan: Plan) => {
    onPlanChange(selectedPlan);
    setShowOtherPlans(false);
  };

  const otherPlans = availablePlans.filter(p => p.id !== plan.id);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">
          Confirme seu plano
        </h2>
        <p className="text-gray-400">
          Revise os detalhes do plano selecionado antes de continuar
        </p>
      </div>

      {/* Plano Selecionado */}
      <div className="relative">
        <div className="border-2 border-green-500/50 rounded-xl p-6 bg-gradient-to-br from-gray-900/80 to-gray-800/90 backdrop-blur-sm shadow-2xl">
          <div className="absolute top-4 right-4">
            <div className="bg-green-500 text-black px-3 py-1 rounded-full text-xs font-bold">
              SELECIONADO
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white">
              {plan.name}
            </h3>
            
            {plan.description && (
              <p className="text-gray-300">
                {plan.description}
              </p>
            )}

            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-bold text-green-400">
                R$ {plan.price.toFixed(2)}
              </span>
              <span className="text-gray-400 text-lg">
                / {formatBillingCycle(plan.billing_cycle).toLowerCase()}
              </span>
            </div>

            {plan.benefits && plan.benefits.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-gray-700">
                <h4 className="text-white font-semibold">Benefícios inclusos:</h4>
                <ul className="space-y-2">
                  {plan.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center text-gray-300">
                      <Check className="text-green-400 mr-3 flex-shrink-0" size={16} />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botão para mostrar outros planos */}
      {otherPlans.length > 0 && (
        <div className="text-center">
          <Button
            onClick={() => setShowOtherPlans(!showOtherPlans)}
            variant="outline"
            className="border-green-600/30 text-green-400 hover:bg-green-600/20 hover:text-green-300 mb-4"
          >
            {showOtherPlans ? (
              <>
                <ChevronUp className="mr-2" size={16} />
                Ocultar outros planos
              </>
            ) : (
              <>
                <ChevronDown className="mr-2" size={16} />
                Ver outros planos disponíveis
              </>
            )}
          </Button>
        </div>
      )}

      {/* Lista de outros planos */}
      {showOtherPlans && otherPlans.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-white font-semibold text-center">Outros planos disponíveis:</h4>
          <div className="grid gap-4">
            {otherPlans.map((otherPlan) => (
              <div
                key={otherPlan.id}
                className="border border-gray-700 rounded-lg p-4 bg-gray-800/30 hover:bg-gray-700/30 transition-colors cursor-pointer"
                onClick={() => handlePlanSelect(otherPlan)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h5 className="text-lg font-semibold text-white mb-1">
                      {otherPlan.name}
                    </h5>
                    {otherPlan.description && (
                      <p className="text-gray-400 text-sm mb-3">
                        {otherPlan.description}
                      </p>
                    )}
                    <div className="flex items-baseline space-x-2">
                      <span className="text-xl font-bold text-green-400">
                        R$ {otherPlan.price.toFixed(2)}
                      </span>
                      <span className="text-gray-400 text-sm">
                        / {formatBillingCycle(otherPlan.billing_cycle).toLowerCase()}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-green-600/30 text-green-400 hover:bg-green-600/20 hover:text-green-300"
                  >
                    Selecionar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botões de ação */}
      <div className="space-y-3 pt-4">
        <Button 
          onClick={onNext}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-green-500 shadow-lg transform hover:scale-105 transition-all"
          size="lg"
        >
          Continuar com este plano
        </Button>
      </div>
    </div>
  );
};

export default CheckoutPlanStep;