
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, CreditCard, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { formatBillingCycle } from '@/utils/formatters';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  billing_cycle: string;
  benefits: string[];
  best_seller: boolean;
  active: boolean;
  priority: number;
}

const Plans = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans'],
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

  const handleSelectPlan = (planId: string) => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para selecionar um plano",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    setSelectedPlan(planId);
    navigate(`/checkout?plan=${planId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Escolha seu Plano
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Selecione o plano que melhor atende às suas necessidades
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans?.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                plan.best_seller ? 'border-primary shadow-lg scale-105' : 'hover:scale-105'
              }`}
            >
              {plan.best_seller && (
                <div className="absolute top-0 right-0 bg-primary text-white px-3 py-1 text-sm font-medium">
                  <Star className="h-4 w-4 inline mr-1" />
                  Mais Popular
                </div>
              )}

              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {plan.name}
                </CardTitle>
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

                <Button
                  onClick={() => handleSelectPlan(plan.id)}
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

                <div className="flex items-center justify-center mt-4 text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  Cobrança {formatBillingCycle(plan.billing_cycle).toLowerCase()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {(!plans || plans.length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              Nenhum plano disponível no momento
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Plans;
