import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { UserRegistrationFlowService } from '@/services/userRegistrationFlow';
import { collectBrowserData } from '@/utils/browserData';
import CheckoutHeader from '@/components/checkout/CheckoutHeader';
import CheckoutFooter from '@/components/checkout/CheckoutFooter';
import CheckoutSteps from '@/components/checkout/CheckoutSteps';
import { CheckoutSuccessModal } from '@/components/checkout/CheckoutSuccessModal';
import { EmailAlreadyExistsModal } from '@/components/auth/EmailAlreadyExistsModal';
import { CheckoutErrorModal } from '@/components/checkout/CheckoutErrorModal';
import { PasswordMismatchModal } from '@/components/checkout/PasswordMismatchModal';

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
  const [searchParams] = useSearchParams();
  
  // Accept planId from both location.state and URL params
  const planId = location.state?.planId || searchParams.get('planId');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados dos modais
  const [modalState, setModalState] = useState<{
    type: 'success' | 'emailExists' | 'error' | 'passwordMismatch' | null;
    data?: any;
  }>({ type: null });
  
  const [formDataCache, setFormDataCache] = useState<any>(null);

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
          setModalState({
            type: 'error',
            data: {
              message: 'Plano não encontrado.',
              errorType: 'validation'
            }
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
  }, [planId, navigate]);

  const handleFormSubmit = async (formData: any) => {
    const { selectedPlan: currentPlan } = formData;
    if (!currentPlan) return;
    
    setIsLoading(true);
    setFormDataCache(formData);

    try {
      // Use UserRegistrationFlowService to handle complete registration
      const registrationResult = await UserRegistrationFlowService.registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        cpf: formData.cpf || '',
        phone: formData.phone || '',
        selectedPlanId: currentPlan.id
      });

      if (!registrationResult.success) {
        // Verificar tipo de erro
        if (registrationResult.errorType === 'emailExists') {
          setModalState({
            type: 'emailExists',
            data: { email: formData.email }
          });
        } else if (registrationResult.requiresPasswordUpdate && registrationResult.maskedEmail) {
          setModalState({
            type: 'passwordMismatch',
            data: { maskedEmail: registrationResult.maskedEmail }
          });
        } else {
          setModalState({
            type: 'error',
            data: {
              message: registrationResult.message || 'Erro ao criar conta. Tente novamente.',
              errorType: registrationResult.errorType || 'generic'
            }
          });
        }
        return;
      }

      // Sucesso! Salvar aceite de termos
      if (registrationResult.userId) {
        try {
          const browserData = collectBrowserData();
          const { error: termsError } = await supabase.functions.invoke('save-terms-acceptance', {
            body: {
              user_id: registrationResult.userId,
              subscription_id: null,
              browser_data: browserData
            }
          });
          
          if (termsError) {
            console.error('Error saving terms acceptance:', termsError);
          } else {
            console.log('✅ Terms acceptance saved successfully');
          }
        } catch (termsError) {
          console.error('Error saving terms acceptance:', termsError);
        }
      }

      setModalState({
        type: 'success',
        data: {
          userName: formData.name,
          planName: currentPlan.name
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      setModalState({
        type: 'error',
        data: {
          message: 'Erro ao criar conta. Tente novamente.',
          errorType: 'generic'
        }
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handlers dos modais
  const handleAccessAccount = async () => {
    if (!formDataCache) return;
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formDataCache.email,
        password: formDataCache.password
      });
      
      if (!error) {
        navigate('/dashboard');
      } else {
        navigate('/login', { state: { email: formDataCache.email } });
      }
    } catch (e) {
      navigate('/login', { state: { email: formDataCache.email } });
    }
  };
  
  const handleGoToPortal = () => {
    const portalUrl = 'https://agromercado.tv.br';
    window.open(portalUrl, '_blank');
  };
  
  const handleLogin = () => {
    if (formDataCache) {
      navigate('/login', { state: { email: formDataCache.email } });
    } else {
      navigate('/login');
    }
  };
  
  const handleResetPassword = () => {
    if (formDataCache) {
      navigate('/reset-password', { state: { email: formDataCache.email } });
    } else {
      navigate('/reset-password');
    }
  };
  
  const handleTryAnotherEmail = () => {
    setModalState({ type: null });
  };
  
  const handleCloseModal = () => {
    setModalState({ type: null });
  };
  
  const handleRetry = () => {
    setModalState({ type: null });
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
          initialPlan={selectedPlan} 
          onSubmit={handleFormSubmit} 
          onPlanChange={() => navigate('/', { replace: true })}
          isLoading={isLoading} 
        />
        <CheckoutFooter />
      </div>
      
      {/* Modais */}
      <CheckoutSuccessModal
        isOpen={modalState.type === 'success'}
        userName={modalState.data?.userName || ''}
        planName={modalState.data?.planName}
        onAccessAccount={handleAccessAccount}
        onGoToPortal={handleGoToPortal}
      />
      
      <EmailAlreadyExistsModal
        isOpen={modalState.type === 'emailExists'}
        email={modalState.data?.email || ''}
        onLogin={handleLogin}
        onResetPassword={handleResetPassword}
        onTryAnotherEmail={handleTryAnotherEmail}
      />
      
      <PasswordMismatchModal
        isOpen={modalState.type === 'passwordMismatch'}
        maskedEmail={modalState.data?.maskedEmail || ''}
        onClose={handleCloseModal}
      />
      
      <CheckoutErrorModal
        isOpen={modalState.type === 'error'}
        title={modalState.data?.title}
        message={modalState.data?.message || ''}
        errorType={modalState.data?.errorType}
        onRetry={handleRetry}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default Checkout;