
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

interface Plan {
  id: string;
  name: string;
  price: number;
  billing_cycle: string;
  description?: string;
  benefits?: string[];
  best_seller?: boolean;
  active: boolean;
  priority: number;
}

const Plans = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

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
      console.error('Error fetching plans:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar planos. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan: Plan) => {
    if (!user) {
      // Redirect to login with return URL
      navigate('/login', { state: { returnTo: '/plans' } });
      return;
    }

    // Navigate to checkout with selected plan
    navigate('/checkout', { state: { planId: plan.id } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando planos...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Escolha seu Plano
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Selecione o plano que melhor se adapta às suas necessidades e comece a participar dos leilões
            </p>
          </div>

          {/* Plans Grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card 
                key={plan.id}
                className={`relative transition-all duration-200 hover:shadow-lg ${
                  plan.best_seller 
                    ? 'ring-2 ring-primary border-primary' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {plan.best_seller && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Mais Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  {plan.description && (
                    <CardDescription className="text-base">
                      {plan.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Price */}
                  <div className="text-center">
                    <div className="text-foreground">
                      <span className="text-sm text-muted-foreground">
                        {plan.billing_cycle === 'annually' ? '12x' : 'Mensal'}
                      </span>
                      <div className="text-4xl font-bold">
                        {formatCurrency(plan.price)}
                      </div>
                    </div>
                    {plan.billing_cycle === 'annually' && (
                      <p className="text-muted-foreground text-sm mt-1">
                        Total de {formatCurrency(plan.price * 12)}
                      </p>
                    )}
                  </div>

                  {/* Benefits */}
                  {plan.benefits && plan.benefits.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium">Benefícios inclusos:</h4>
                      <ul className="space-y-2">
                        {plan.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* CTA Button */}
                  <Button 
                    className={`w-full ${
                      plan.best_seller 
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                        : ''
                    }`}
                    size="lg"
                    onClick={() => handleSelectPlan(plan)}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Selecionar Plano
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Additional Info */}
          <div className="text-center mt-12 max-w-2xl mx-auto">
            <p className="text-muted-foreground text-sm">
              Todos os planos incluem acesso completo à plataforma de leilões, suporte técnico e atualizações gratuitas. 
              Você pode cancelar sua assinatura a qualquer momento.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Plans;
