import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import CheckoutPlanStep from './CheckoutPlanStep';
import CheckoutPersonalStep from './CheckoutPersonalStep';
import CheckoutCouponStep from './CheckoutCouponStep';
import CheckoutCredentialsStep from './CheckoutCredentialsStep';

interface Plan {
  id: string;
  name: string;
  price: number;
  billing_cycle: string;
  description?: string;
  benefits?: string[];
}

interface CheckoutStepsProps {
  initialPlan: Plan;
  onSubmit: (formData: any) => void;
  onPlanChange: () => void;
  isLoading: boolean;
}

const CheckoutSteps = ({ initialPlan, onSubmit, onPlanChange, isLoading }: CheckoutStepsProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState(initialPlan);
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    coupon: null
  });

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

  const handleStepSubmit = (stepData: any) => {
    const updatedFormData = { ...formData, ...stepData };
    setFormData(updatedFormData);
    
    if (currentStep === 4) {
      onSubmit({ 
        ...updatedFormData, 
        selectedPlan: selectedPlan 
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

  const handlePlanChange = (newPlan: Plan) => {
    setSelectedPlan(newPlan);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <CheckoutPlanStep plan={selectedPlan} onNext={handleNext} onPlanChange={handlePlanChange} />;
      case 2:
        return <CheckoutPersonalStep initialData={formData} onSubmit={handleStepSubmit} />;
      case 3:
        return <CheckoutCouponStep onCouponApplied={handleCouponApplied} onSkip={handleSkipCoupon} />;
      case 4:
        return <CheckoutCredentialsStep initialData={formData} onSubmit={handleStepSubmit} isLoading={isLoading} />;
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
                currentStep === step.number ? 'border-green-500 text-green-500 bg-green-500/20' :
                'border-gray-600 text-gray-400'
              }`}>
                {step.completed ? <Check className="w-5 h-5" /> : step.number}
              </div>
              <span className={`text-sm ${
                step.completed ? 'text-green-400' :
                currentStep === step.number ? 'text-green-400' :
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
        <Progress value={progress} className="w-64 mx-auto [&>div]:bg-green-500" />
      </div>

      {/* Step Content */}
      <div className="max-w-2xl mx-auto">
        <Card className="bg-black border-green-500/50 shadow-2xl shadow-green-500/20">
          <CardHeader className="bg-gradient-to-r from-green-900/20 to-green-800/10 border-b border-green-500/30">
            <CardTitle className="text-green-400 text-center text-xl font-bold">
              Etapa {currentStep} de 4
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-black/95 backdrop-blur-sm">
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
            className="flex items-center space-x-2 border-green-600/30 text-green-400 hover:bg-green-600/20 hover:text-green-300"
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