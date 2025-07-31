import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import CheckoutPlanStep from './CheckoutPlanStep';
import CheckoutPersonalStep from './CheckoutPersonalStep';
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
  plan: Plan;
  onSubmit: (formData: any) => void;
  isLoading: boolean;
}

const CheckoutSteps = ({ plan, onSubmit, isLoading }: CheckoutStepsProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const steps = [
    { number: 1, title: 'Plano', completed: currentStep > 1 },
    { number: 2, title: 'Dados Pessoais', completed: currentStep > 2 },
    { number: 3, title: 'Credenciais', completed: false }
  ];

  const progress = ((currentStep - 1) / 2) * 100;

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepSubmit = (stepData: any) => {
    setFormData({ ...formData, ...stepData });
    
    if (currentStep === 3) {
      onSubmit({ ...formData, ...stepData });
    } else {
      handleNext();
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <CheckoutPlanStep plan={plan} onNext={handleNext} />;
      case 2:
        return <CheckoutPersonalStep initialData={formData} onSubmit={handleStepSubmit} />;
      case 3:
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
              Etapa {currentStep} de 3
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
            <ChevronLeft className="w-4 h-4" />
            <span>Voltar</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default CheckoutSteps;