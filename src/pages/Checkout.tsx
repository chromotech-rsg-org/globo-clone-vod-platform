
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import CheckoutHeader from '@/components/checkout/CheckoutHeader';
import CheckoutFooter from '@/components/checkout/CheckoutFooter';
import CheckoutSteps from '@/components/checkout/CheckoutSteps';
import PlanSelector from '@/components/checkout/PlanSelector';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  billing_cycle: string;
  description?: string;
  benefits?: string[];
  best_seller?: boolean;
}

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { register } = useAuth();
  const { toast } = useToast();
  
  const planId = location.state?.planId;
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

      setAvailablePlans(data || []);

      // Se um plano específico foi passado, selecione-o
      if (planId) {
        const specificPlan = data?.find(p => p.id === planId);
        if (specificPlan) {
          setSelectedPlan(specificPlan);
        } else {
          toast({
            title: "Erro",
            description: "Plano não encontrado.",
            variant: "destructive"
          });
          navigate('/');
        }
      } else {
        // Se não há plano específico, mostrar seletor
        setShowPlanSelector(true);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      navigate('/');
    }
  };

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowPlanSelector(false);
  };

  const handleChangePlan = () => {
    setShowPlanSelector(true);
  };

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

      // Verificar se os termos foram aceitos
      if (!formData.acceptedTerms) {
        toast({
          title: "Erro",
          description: "Você deve aceitar os termos e condições para continuar.",
          variant: "destructive"
        });
        return;
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

          // Criar assinatura
          await supabase.from('subscriptions').insert({
            user_id: authData.user.id,
            plan_id: selectedPlan.id,
            status: 'active',
            end_date: endDate.toISOString()
          });

          // Salvar aceite dos termos
          const termsData = {
            user_id: authData.user.id,
            terms_version: '1.0',
            ip_address: await fetch('https://api.ipify.org?format=json')
              .then(res => res.json())
              .then(data => data.ip)
              .catch(() => 'unknown'),
            user_agent: navigator.userAgent,
            locale: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            screen_resolution: `${screen.width}x${screen.height}`,
            referrer: document.referrer || 'direct'
          };

          await supabase.from('terms_acceptances').insert(termsData);
        }

        navigate('/dashboard');
        
        const successMessage = formData.coupon 
          ? `Conta criada com sucesso! Desconto aplicado: ${formatCurrency(discountAmount)}`
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

  if (showPlanSelector) {
    return (
      <div className="min-h-screen bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <CheckoutHeader />
          
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="text-white hover:text-gray-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>

          <PlanSelector
            plans={availablePlans}
            selectedPlan={selectedPlan}
            onSelectPlan={handlePlanSelect}
          />
          
          <CheckoutFooter />
        </div>
      </div>
    );
  }

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
        
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={handleChangePlan}
            className="text-white border-white/20 hover:bg-white/10"
          >
            Trocar Plano
          </Button>
        </div>

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
