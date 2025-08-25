
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

interface Plan {
  id: string;
  name: string;
  price: number;
  billing_cycle: string;
  description?: string;
  benefits?: string[];
  best_seller?: boolean;
}

interface PlanSelectorProps {
  plans: Plan[];
  selectedPlan: Plan | null;
  onSelectPlan: (plan: Plan) => void;
}

const PlanSelector = ({ plans, selectedPlan, onSelectPlan }: PlanSelectorProps) => {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-2">Escolha seu Plano</h3>
        <p className="text-gray-400 text-sm">Selecione o plano que melhor se adapta às suas necessidades</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card 
            key={plan.id}
            className={`relative cursor-pointer transition-all duration-200 ${
              selectedPlan?.id === plan.id 
                ? 'ring-2 ring-primary bg-primary/5' 
                : 'hover:ring-1 hover:ring-primary/50'
            } ${
              plan.best_seller 
                ? 'border-primary' 
                : 'border-gray-700'
            }`}
            onClick={() => onSelectPlan(plan)}
          >
            {plan.best_seller && (
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  Mais Popular
                </Badge>
              </div>
            )}
            
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg">{plan.name}</CardTitle>
                {selectedPlan?.id === plan.id && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </div>
              {plan.description && (
                <CardDescription className="text-gray-400">
                  {plan.description}
                </CardDescription>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-white">
                  <span className="text-sm">
                    {plan.billing_cycle === 'annually' ? '12x' : 'Mensal'}
                  </span>
                  <div className="text-2xl font-bold">
                    {formatCurrency(plan.price)}
                  </div>
                </div>
                {plan.billing_cycle === 'annually' && (
                  <p className="text-gray-400 text-sm">
                    Total de {formatCurrency(plan.price * 12)}
                  </p>
                )}
              </div>

              {plan.benefits && plan.benefits.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-white font-medium text-sm">Benefícios inclusos:</h4>
                  <ul className="text-gray-300 text-sm space-y-1">
                    {plan.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-3 w-3 text-primary mt-1 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button 
                className={`w-full ${
                  selectedPlan?.id === plan.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPlan(plan);
                }}
              >
                {selectedPlan?.id === plan.id ? 'Selecionado' : 'Selecionar'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PlanSelector;
