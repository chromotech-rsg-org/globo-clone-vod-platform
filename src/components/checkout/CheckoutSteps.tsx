
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import CheckoutPlanStep from './CheckoutPlanStep';
import CheckoutPersonalStep from './CheckoutPersonalStep';
import CheckoutCouponStep from './CheckoutCouponStep';
import CheckoutCredentialsStep from './CheckoutCredentialsStep';
import { useTermsAcceptance } from '@/hooks/useTermsAcceptance';

interface Plan {
  id: string;
  name: string;
  price: number;
  billing_cycle: string;
  description?: string;
  benefits?: string[];
}

interface CheckoutStepsProps {
  plan: Plan;
  onSubmit: (formData: any) => void;
  isLoading: boolean;
}

const CheckoutSteps = ({ plan: initialPlan, onSubmit, isLoading }: CheckoutStepsProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState(initialPlan);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    coupon: null
  });

  const { acceptTerms, loading: acceptingTerms } = useTermsAcceptance();

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
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const steps = [
    { number: 1, title: 'Plano', completed: currentStep > 1 },
    { number: 2, title: 'Dados Pessoais', completed: currentStep > 2 },
    { number: 3, title: 'Cupom', completed: currentStep > 3 },
    { number: 4, title: 'Credenciais', completed: false }
  ];

  const progress = ((currentStep - 1) / 3) * 100;

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepSubmit = async (stepData: any) => {
    setFormData({ ...formData, ...stepData });
    
    if (currentStep === 4) {
      if (!termsAccepted) {
        return; // Terms must be accepted
      }

      // Accept terms first
      const termsResult = await acceptTerms({ termsVersion: '1.0' });
      if (!termsResult.success) {
        console.error('Failed to accept terms');
        return;
      }

      onSubmit({ 
        ...formData, 
        ...stepData, 
        selectedPlan,
        termsAccepted: true 
      });
    } else {
      handleNext();
    }
  };

  const handleCouponApplied = (coupon: any) => {
    setFormData({ ...formData, coupon });
    handleNext();
  };

  const handleSkipCoupon = () => {
    setFormData({ ...formData, coupon: null });
    handleNext();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <CheckoutPlanStep plan={selectedPlan} onNext={handleNext} />
            
            {availablePlans.length > 1 && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-white mb-4">Outros planos disponíveis:</h3>
                <div className="grid gap-4">
                  {availablePlans
                    .filter(p => p.id !== selectedPlan.id)
                    .map((plan) => (
                    <Card 
                      key={plan.id} 
                      className="cursor-pointer border-gray-600 hover:border-blue-500 transition-colors"
                      onClick={() => setSelectedPlan(plan)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="text-white font-medium">{plan.name}</h4>
                            <p className="text-gray-400 text-sm">{plan.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-bold">
                              R$ {plan.price.toFixed(2)}
                            </p>
                            <p className="text-gray-400 text-sm">
                              /{plan.billing_cycle === 'annually' ? 'ano' : 'mês'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case 2:
        return <CheckoutPersonalStep initialData={formData} onSubmit={handleStepSubmit} />;
      case 3:
        return <CheckoutCouponStep onCouponApplied={handleCouponApplied} onSkip={handleSkipCoupon} />;
      case 4:
        return (
          <div className="space-y-6">
            <CheckoutCredentialsStep 
              initialData={formData} 
              onSubmit={handleStepSubmit} 
              isLoading={isLoading || acceptingTerms} 
            />
            
            <div className="border-t pt-6">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                />
                <label htmlFor="terms" className="text-sm text-gray-300">
                  Eu aceito os{' '}
                  <Link 
                    to="/termos-e-condicoes" 
                    target="_blank" 
                    className="text-blue-400 hover:underline"
                  >
                    Termos e Condições de Uso
                  </Link>
                  {' '}e confirmo que li e entendi todas as cláusulas.
                </label>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Progress Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center items-center space-x-8">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center space-x-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                step.completed ? 'bg-green-600 border-green-600 text-white' :
                currentStep === step.number ? 'border-blue-600 text-blue-600' :
                'border-gray-600 text-gray-400'
              }`}>
                {step.completed ? <Check className="w-5 h-5" /> : step.number}
              </div>
              <span className={`text-sm ${
                step.completed ? 'text-green-400' :
                currentStep === step.number ? 'text-blue-400' :
                'text-gray-400'
              }`}>
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <ChevronRight className="w-4 h-4 text-gray-600 ml-4" />
              )}
            </div>
          ))}
        </div>
        <Progress value={progress} className="w-64 mx-auto" />
      </div>

      {/* Step Content */}
      <div className="max-w-2xl mx-auto">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-center">
              Etapa {currentStep} de 4
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>
      </div>

      {/* Navigation Buttons */}
      {currentStep > 1 && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="w-4 w-4" />
            <span>Voltar</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default CheckoutSteps;
