
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, CreditCard, Calendar, Edit, Trash2 } from 'lucide-react';
import { formatBillingCycle } from '@/utils/formatters';
import { Plan } from '@/hooks/usePlans';

interface PlanCardProps {
  plan: Plan;
  onSelect?: (planId: string) => void;
  onEdit?: (plan: Plan) => void;
  onDelete?: (planId: string) => void;
  showActions?: boolean;
  isSelected?: boolean;
}

const PlanCard = ({ 
  plan, 
  onSelect, 
  onEdit, 
  onDelete, 
  showActions = false, 
  isSelected = false 
}: PlanCardProps) => {
  return (
    <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
      plan.best_seller ? 'border-primary shadow-lg scale-105' : 'hover:scale-105'
    } ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      {plan.best_seller && (
        <div className="absolute top-0 right-0 bg-primary text-white px-3 py-1 text-sm font-medium">
          <Star className="h-4 w-4 inline mr-1" />
          Mais Popular
        </div>
      )}

      <CardHeader className="text-center pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-gray-900">
            {plan.name}
          </CardTitle>
          {showActions && (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit?.(plan)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete?.(plan.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-center space-x-2 mt-2">
          <Badge variant={plan.active ? 'default' : 'secondary'}>
            {plan.active ? 'Ativo' : 'Inativo'}
          </Badge>
          {plan.free_days > 0 && (
            <Badge variant="outline">
              {plan.free_days} dias grátis
            </Badge>
          )}
        </div>

        {plan.description && (
          <p className="text-gray-600 text-sm mt-2">
            {plan.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="text-center">
        <div className="mb-6">
          <div className="flex items-baseline justify-center">
            <span className="text-4xl font-bold text-gray-900">
              R$ {plan.price.toFixed(2)}
            </span>
            <span className="text-gray-500 ml-2">
              / {formatBillingCycle(plan.billing_cycle).toLowerCase()}
            </span>
          </div>
        </div>

        {plan.benefits && plan.benefits.length > 0 && (
          <div className="space-y-3 mb-8">
            {plan.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center text-left">
                <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        )}

        {onSelect && (
          <Button
            onClick={() => onSelect(plan.id)}
            className={`w-full ${
              plan.best_seller 
                ? 'bg-primary hover:bg-primary/90' 
                : 'bg-gray-900 hover:bg-gray-800'
            } text-white`}
            size="lg"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Selecionar Plano
          </Button>
        )}

        <div className="flex items-center justify-center mt-4 text-sm text-gray-500">
          <Calendar className="h-4 w-4 mr-1" />
          Cobrança {formatBillingCycle(plan.billing_cycle).toLowerCase()}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanCard;
