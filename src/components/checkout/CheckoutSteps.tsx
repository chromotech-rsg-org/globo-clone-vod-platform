import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Link } from 'react-router-dom';
import CheckoutPersonalStep from './CheckoutPersonalStep';
import CheckoutCredentialsStep from './CheckoutCredentialsStep';
import CheckoutCouponStep from './CheckoutCouponStep';
import PlanSummary from './PlanSummary';
interface Plan {
  name: string;
  price: number;
}
interface CheckoutStepsProps {
  plan: Plan;
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
}
const CheckoutSteps = ({
  plan,
  onSubmit,
  isLoading
}: CheckoutStepsProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    cpf: '',
    phone: '',
    coupon: null,
    acceptedTerms: false
  });
  const steps = [{
    number: 1,
    title: 'Dados Pessoais'
  }, {
    number: 2,
    title: 'Credenciais'
  }, {
    number: 3,
    title: 'Cupom (Opcional)'
  }, {
    number: 4,
    title: 'Finalizar'
  }];
  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  const handleStepData = (stepData: any) => {
    setFormData(prev => ({
      ...prev,
      ...stepData
    }));
  };
  const handlePersonalStepSubmit = (data: any) => {
    handleStepData(data);
    handleNext();
  };
  const handleCredentialsStepSubmit = (data: any) => {
    handleStepData(data);
    handleNext();
  };
  const handleCouponApplied = (coupon: any) => {
    handleStepData({
      coupon
    });
    handleNext();
  };
  const handleCouponSkip = () => {
    handleNext();
  };
  const handleSubmit = async () => {
    if (!formData.acceptedTerms) {
      return;
    }
    await onSubmit(formData);
  };
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name && formData.cpf && formData.phone;
      case 2:
        return formData.email && formData.password;
      case 3:
        return true;
      // Cupom é opcional
      case 4:
        return formData.acceptedTerms;
      default:
        return false;
    }
  };
  return <div className="grid lg:grid-cols-3 gap-8">
      {/* Formulário */}
      <div className="lg:col-span-2">
        {/* Indicador de Passos */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => <div key={step.number} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= step.number ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
                {step.number}
              </div>
              <span className={`ml-2 text-sm ${currentStep >= step.number ? 'text-white' : 'text-gray-400'}`}>
                {step.title}
              </span>
              {index < steps.length - 1 && <div className={`w-12 h-px mx-4 ${currentStep > step.number ? 'bg-blue-600' : 'bg-gray-700'}`} />}
            </div>)}
        </div>

        {/* Conteúdo do Passo */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            {currentStep === 1 && <CheckoutPersonalStep initialData={{
            name: formData.name,
            cpf: formData.cpf,
            phone: formData.phone
          }} onSubmit={handlePersonalStepSubmit} />}
            {currentStep === 2 && <CheckoutCredentialsStep initialData={{
            email: formData.email,
            password: formData.password,
            confirmPassword: formData.confirmPassword
          }} onSubmit={handleCredentialsStepSubmit} isLoading={false} />}
            {currentStep === 3 && <CheckoutCouponStep onCouponApplied={handleCouponApplied} onSkip={handleCouponSkip} />}
            {currentStep === 4 && <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white mb-4">
                    Revisar e Finalizar
                  </h2>
                  <p className="text-gray-400">
                    Confirme suas informações antes de finalizar
                  </p>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-4">Revisar Informações</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Nome:</span>
                      <p className="text-white">{formData.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Email:</span>
                      <p className="text-white">{formData.email}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">CPF:</span>
                      <p className="text-white">{formData.cpf}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Telefone:</span>
                      <p className="text-white">{formData.phone}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-2">
                    <Checkbox id="terms" checked={formData.acceptedTerms} onCheckedChange={checked => handleStepData({
                  acceptedTerms: checked
                })} className="mt-1" />
                    <label htmlFor="terms" className="text-sm text-gray-300 leading-relaxed">
                      Eu li e aceito os{' '}
                      <Link to="/terms" target="_blank" className="text-blue-400 hover:text-blue-300 underline">
                        Termos e Condições
                      </Link>{' '}
                      e a Política de Privacidade da plataforma.
                    </label>
                  </div>

                  {!formData.acceptedTerms && <p className="text-red-400 text-sm">
                      Você deve aceitar os termos e condições para continuar.
                    </p>}
                </div>

                <div className="pt-4">
                  <Button onClick={handleSubmit} disabled={!canProceed() || isLoading} className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                    {isLoading ? 'Criando conta...' : 'Finalizar Compra'}
                  </Button>
                </div>
              </div>}
          </CardContent>
        </Card>

        {/* Botões de Navegação - Only show for steps 1-3 */}
        {currentStep < 4 && <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1} className="border-gray-600 hover:bg-gray-700 text-gray-50">
              Anterior
            </Button>
          </div>}
      </div>

      {/* Resumo do Plano */}
      <div className="lg:col-span-1">
        <PlanSummary plan={plan} />
      </div>
    </div>;
};
export default CheckoutSteps;