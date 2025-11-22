import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, QrCode, CreditCard, Check } from 'lucide-react';
import { PaymentMethod } from '@/types/asaas';

interface Plan {
  id: string;
  name: string;
  price: number;
  payment_methods: PaymentMethod[];
}

interface CheckoutPaymentStepProps {
  plan: Plan;
  onMethodSelect: (method: PaymentMethod) => void;
}

const paymentMethodIcons = {
  BOLETO: FileText,
  PIX: QrCode,
  CREDIT_CARD: CreditCard,
};

const paymentMethodNames = {
  BOLETO: 'Boleto Bancário',
  PIX: 'PIX',
  CREDIT_CARD: 'Cartão de Crédito',
};

const paymentMethodDescriptions = {
  BOLETO: 'Vence em 7 dias. Compensação em até 2 dias úteis.',
  PIX: 'Pagamento instantâneo. Confirmação em segundos.',
  CREDIT_CARD: 'Processamento imediato. Aprovação na hora.',
};

export const CheckoutPaymentStep = ({ plan, onMethodSelect }: CheckoutPaymentStepProps) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  const handleSelectMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
  };

  const handleContinue = () => {
    if (selectedMethod) {
      onMethodSelect(selectedMethod);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Escolha a forma de pagamento</h2>
        <p className="text-muted-foreground">
          Selecione como você deseja pagar pelo plano {plan.name}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plan.payment_methods.map((method) => {
          const Icon = paymentMethodIcons[method];
          const isSelected = selectedMethod === method;

          return (
            <Card
              key={method}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                isSelected ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleSelectMethod(method)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {paymentMethodNames[method]}
                  </div>
                  {isSelected && <Check className="h-5 w-5 text-primary" />}
                </CardTitle>
                <CardDescription>{paymentMethodDescriptions[method]}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {method === 'BOLETO' && '• Válido em qualquer banco\n• Sem taxas extras'}
                  {method === 'PIX' && '• Disponível 24/7\n• Confirmação automática'}
                  {method === 'CREDIT_CARD' && '• Aceitamos principais bandeiras\n• Pagamento seguro'}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <div>
          <p className="text-sm text-muted-foreground">Total a pagar:</p>
          <p className="text-2xl font-bold">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(plan.price)}
          </p>
        </div>
        <Button
          size="lg"
          onClick={handleContinue}
          disabled={!selectedMethod}
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};