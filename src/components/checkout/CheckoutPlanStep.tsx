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
}

const CheckoutPlanStep = ({ plan, onNext }: CheckoutPlanStepProps) => {
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

      <div className="border border-gray-600 rounded-lg p-6 bg-gray-700">
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
            <span className="text-3xl font-bold">
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
                  <li key={index}>• {benefit}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="text-center">
        <Button 
          onClick={onNext}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          size="lg"
        >
          Continuar com este plano
        </Button>
      </div>
    </div>
  );
};

export default CheckoutPlanStep;