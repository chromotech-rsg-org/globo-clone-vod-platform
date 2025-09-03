import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import CheckoutHeader from '@/components/checkout/CheckoutHeader';
import CheckoutFooter from '@/components/checkout/CheckoutFooter';
import CheckoutSteps from '@/components/checkout/CheckoutSteps';

interface Plan {
  id: string;
  name: string;
  price: number;
  billing_cycle: string;
  description?: string;
  benefits?: string[];
}

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { register } = useAuth();
  const { toast } = useToast();
  
  const planId = location.state?.planId;
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPlan = async () => {
      if (!planId) {
        navigate('/');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('plans')
          .select('*')
          .eq('id', planId)
          .eq('active', true)
          .single();

        if (error || !data) {
          toast({
            title: "Erro",
            description: "Plano não encontrado.",
            variant: "destructive"
          });
          navigate('/');
          return;
        }

        setSelectedPlan(data);
      } catch (error) {
        console.error('Error fetching plan:', error);
        navigate('/');
      }
    };

    fetchPlan();
  }, [planId, navigate, toast]);

  const handleFormSubmit = async (formData: any) => {
    if (!selectedPlan) return;
    
    setIsLoading(true);

    try {
      // Calculate final price with coupon discount
      let finalPrice = selectedPlan.price;
      let discountAmount = 0;
      
      if (formData.coupon) {
        discountAmount = (selectedPlan.price * formData.coupon.discount_percentage) / 100;
        finalPrice = selectedPlan.price - discountAmount;
      }

      const { error } = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        cpf: formData.cpf,
        phone: formData.phone
      });
      
      if (error) {
        toast({
          title: "Erro",
          description: error.message || "Erro ao criar conta. Tente novamente.",
          variant: "destructive"
        });
      } else {
        // Create subscription after successful registration
        const { data: authData } = await supabase.auth.getUser();
        if (authData.user) {
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + (selectedPlan.billing_cycle === 'annually' ? 12 : 1));

          const { data: subscriptionData, error: subscriptionError } = await supabase
            .from('subscriptions')
            .insert({
              user_id: authData.user.id,
              plan_id: selectedPlan.id,
              status: 'active',
              end_date: endDate.toISOString()
            })
            .select()
            .single();

          if (subscriptionError) {
            console.error('Error creating subscription:', subscriptionError);
          } else if (subscriptionData) {
            // Queue integration job for subscription
            try {
              const { MotvIntegrationService } = await import('@/services/motvIntegration');
              await MotvIntegrationService.subscribeUser(authData.user.id, subscriptionData);
            } catch (integrationError) {
              console.warn('Integration subscription failed:', integrationError);
              // Don't fail the main operation for integration errors
            }
          }
        }

        navigate('/dashboard');
        
        const successMessage = formData.coupon 
          ? `Conta criada com sucesso! Desconto aplicado: R$ ${discountAmount.toFixed(2)}`
          : `Bem-vindo ao ${selectedPlan.name}`;
          
        toast({
          title: "Conta criada com sucesso!",
          description: successMessage
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar conta. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <CheckoutHeader />
        <CheckoutSteps 
          plan={selectedPlan} 
          onSubmit={handleFormSubmit} 
          isLoading={isLoading} 
        />
        <CheckoutFooter />
      </div>
    </div>
  );
};

export default Checkout;