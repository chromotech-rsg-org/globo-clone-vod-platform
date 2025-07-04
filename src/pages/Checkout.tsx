
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import CheckoutHeader from '@/components/checkout/CheckoutHeader';
import CheckoutFooter from '@/components/checkout/CheckoutFooter';
import PlanSummary from '@/components/checkout/PlanSummary';
import CheckoutForm from '@/components/checkout/CheckoutForm';

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { register } = useAuth();
  const { toast } = useToast();
  
  const selectedPlan = location.state?.selectedPlan || 'premiere';
  const billingCycle = location.state?.billingCycle || 'anual';

  const [isLoading, setIsLoading] = useState(false);

  const plans = {
    premiere: { name: 'Globoplay Premiere', price: 36.90 },
    cartola: { name: 'Globoplay Cartola', price: 15.40 },
    telecine: { name: 'Globoplay Telecine', price: 29.90 },
    combate: { name: 'Globoplay Combate', price: 28.80 }
  };

  const currentPlan = plans[selectedPlan as keyof typeof plans];

  const handleFormSubmit = async (formData: any) => {
    setIsLoading(true);

    try {
      const { error } = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        cpf: formData.cpf,
        phone: formData.phone,
        plan: currentPlan.name
      });
      
      if (error) {
        toast({
          title: "Erro",
          description: error.message || "Erro ao criar conta. Tente novamente.",
          variant: "destructive"
        });
      } else {
        navigate('/dashboard');
        toast({
          title: "Conta criada com sucesso!",
          description: "Bem-vindo ao Globoplay"
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

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <CheckoutHeader />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <PlanSummary plan={currentPlan} />
          <div>
            <CheckoutForm onSubmit={handleFormSubmit} isLoading={isLoading} />
            <CheckoutFooter />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
