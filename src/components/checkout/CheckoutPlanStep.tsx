import React from 'react';
import { Button } from '@/components/ui/button';
import { formatBillingCycle } from '@/utils/formatters';

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
  onPlanChange: () => void;
}

const CheckoutPlanStep = ({ plan, onNext, onPlanChange }: CheckoutPlanStepProps) => {
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

      <div className="border border-green-600/30 rounded-lg p-6 bg-gray-800/50 backdrop-blur-sm">
        <div className="text-center space-y-4">
          <h3 className="text-xl font-semibold text-white">
            {plan.name}
          </h3>
          
          {plan.description && (
            <p className="text-gray-300 text-sm">
              {plan.description}
            </p>
          )}

          <div className="text-white">
            <span className="text-3xl font-bold text-green-400">
              R$ {plan.price.toFixed(2)}
            </span>
            <span className="text-gray-400 ml-2">
              / {formatBillingCycle(plan.billing_cycle).toLowerCase()}
            </span>
          </div>

          {plan.benefits && plan.benefits.length > 0 && (
            <div className="space-y-2 mt-6">
              <h4 className="text-white font-medium text-left">Benefícios inclusos:</h4>
              <ul className="text-gray-300 text-sm space-y-1 text-left">
                {plan.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center">
                    <span className="text-green-400 mr-2">•</span> 
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <Button 
          onClick={onNext}
          className="w-full bg-green-600 hover:bg-green-700 text-white border-green-500 shadow-lg"
          size="lg"
        >
          Continuar com este plano
        </Button>
        
        <Button 
          onClick={onPlanChange}
          variant="outline"
          className="w-full border-green-600/30 text-green-400 hover:bg-green-600/20 hover:text-green-300"
          size="lg"
        >
          Trocar de plano
        </Button>
      </div>
    </div>
  );
};

export default CheckoutPlanStep;