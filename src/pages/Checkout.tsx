import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserRegistrationFlowService } from '@/services/userRegistrationFlow';
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

      // Use UserRegistrationFlowService to handle complete registration
      const registrationResult = await UserRegistrationFlowService.registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        cpf: formData.cpf || '',
        phone: formData.phone || '',
        selectedPlanId: selectedPlan.id
      });

      if (!registrationResult.success) {
        toast({
          title: "Erro",
          description: registrationResult.message || "Erro ao criar conta. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      // If registration requires password reset, show appropriate message
      if (registrationResult.requiresPasswordReset) {
        toast({
          title: "Atenção",
          description: registrationResult.message,
          variant: "destructive"
        });
        navigate('/reset-password');
        return;
      }

      // Navigate to dashboard on success
      navigate('/dashboard');
      
      const successMessage = formData.coupon 
        ? `Conta criada com sucesso! Desconto aplicado: R$ ${discountAmount.toFixed(2)}`
        : registrationResult.message || `Bem-vindo ao ${selectedPlan.name}`;
        
      toast({
        title: "Conta criada com sucesso!",
        description: successMessage
      });

    } catch (error) {
      console.error('Registration error:', error);
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-400 animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-6xl mx-auto px-4">
        <CheckoutHeader />
        <CheckoutSteps 
          plan={selectedPlan} 
          onSubmit={handleFormSubmit} 
          onPlanChange={() => navigate('/', { replace: true })}
          isLoading={isLoading} 
        />
        <CheckoutFooter />
      </div>
    </div>
  );
};

export default Checkout;