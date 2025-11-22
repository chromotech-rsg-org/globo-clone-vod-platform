import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Check, X } from 'lucide-react';
import { useAsaasPayment } from '@/hooks/useAsaasPayment';
import { CreatePaymentResponse } from '@/types/asaas';
import {
  formatCardNumber,
  formatExpiryDate,
  formatCVV,
  validateCardNumber,
  getCardBrand,
} from '@/utils/creditCardMask';

interface CreditCardPaymentFormProps {
  customerId: string;
  planId: string;
  planName: string;
  planPrice: number;
  userCpf: string;
  userPhone: string;
  onSuccess: (payment: CreatePaymentResponse) => void;
  onError: (error: string) => void;
}

export const CreditCardPaymentForm = ({
  customerId,
  planId,
  planName,
  planPrice,
  userCpf,
  userPhone,
  onSuccess,
  onError,
}: CreditCardPaymentFormProps) => {
  const [formData, setFormData] = useState({
    holderName: '',
    number: '',
    expiry: '',
    cvv: '',
    cpf: userCpf,
    postalCode: '',
    addressNumber: '',
    phone: userPhone,
  });
  const [cardBrand, setCardBrand] = useState('');
  const [payment, setPayment] = useState<CreatePaymentResponse | null>(null);
  const { loading, createPayment } = useAsaasPayment();

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;

    if (field === 'number') {
      formattedValue = formatCardNumber(value);
      setCardBrand(getCardBrand(value));
    } else if (field === 'expiry') {
      formattedValue = formatExpiryDate(value);
    } else if (field === 'cvv') {
      formattedValue = formatCVV(value);
    } else if (field === 'holderName') {
      formattedValue = value.toUpperCase();
    }

    setFormData((prev) => ({ ...prev, [field]: formattedValue }));
  };

  const isValidForm = () => {
    return (
      formData.holderName.length >= 3 &&
      validateCardNumber(formData.number) &&
      formData.expiry.length === 5 &&
      formData.cvv.length >= 3 &&
      formData.postalCode.length >= 8 &&
      formData.addressNumber.length > 0
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidForm()) {
      onError('Por favor, preencha todos os campos corretamente');
      return;
    }

    const [expiryMonth, expiryYear] = formData.expiry.split('/');

    try {
      const result = await createPayment({
        customerId,
        planId,
        paymentMethod: 'CREDIT_CARD',
        creditCardData: {
          holderName: formData.holderName,
          number: formData.number.replace(/\s/g, ''),
          expiryMonth,
          expiryYear: `20${expiryYear}`,
          ccv: formData.cvv,
          cpf: formData.cpf,
          postalCode: formData.postalCode,
          addressNumber: formData.addressNumber,
          phone: formData.phone,
        },
      });

      setPayment(result);

      if (result.status === 'CONFIRMED' || result.status === 'RECEIVED') {
        onSuccess(result);
      } else {
        onError('Pagamento recusado. Verifique os dados do cartão e tente novamente.');
      }
    } catch (error: any) {
      onError(error.message);
    }
  };

  if (payment) {
    const isApproved = payment.status === 'CONFIRMED' || payment.status === 'RECEIVED';

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isApproved ? (
              <Check className="h-5 w-5 text-green-600" />
            ) : (
              <X className="h-5 w-5 text-red-600" />
            )}
            {isApproved ? 'Pagamento Aprovado!' : 'Pagamento Recusado'}
          </CardTitle>
          <CardDescription>
            {isApproved
              ? 'Seu pagamento foi processado com sucesso'
              : 'Não foi possível processar o pagamento'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`rounded-lg border p-6 text-center ${
              isApproved
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            {isApproved ? (
              <Check className="h-12 w-12 text-green-600 mx-auto mb-3" />
            ) : (
              <X className="h-12 w-12 text-red-600 mx-auto mb-3" />
            )}
            <p
              className={`text-lg font-semibold mb-2 ${
                isApproved ? 'text-green-900' : 'text-red-900'
              }`}
            >
              {isApproved
                ? 'Pagamento confirmado!'
                : 'Pagamento não autorizado'}
            </p>
            <p
              className={`text-sm ${
                isApproved ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {isApproved
                ? 'Sua assinatura foi ativada com sucesso.'
                : 'Verifique os dados do cartão e tente novamente.'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Pagamento via Cartão de Crédito
        </CardTitle>
        <CardDescription>Preencha os dados do seu cartão</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="holderName">Nome do Titular</Label>
            <Input
              id="holderName"
              placeholder="Nome como está no cartão"
              value={formData.holderName}
              onChange={(e) => handleInputChange('holderName', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="number">Número do Cartão</Label>
            <div className="relative">
              <Input
                id="number"
                placeholder="0000 0000 0000 0000"
                value={formData.number}
                onChange={(e) => handleInputChange('number', e.target.value)}
                maxLength={19}
                required
              />
              {cardBrand && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {cardBrand}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">Validade</Label>
              <Input
                id="expiry"
                placeholder="MM/AA"
                value={formData.expiry}
                onChange={(e) => handleInputChange('expiry', e.target.value)}
                maxLength={5}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                placeholder="123"
                value={formData.cvv}
                onChange={(e) => handleInputChange('cvv', e.target.value)}
                maxLength={4}
                type="password"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postalCode">CEP</Label>
              <Input
                id="postalCode"
                placeholder="00000-000"
                value={formData.postalCode}
                onChange={(e) => handleInputChange('postalCode', e.target.value)}
                maxLength={9}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressNumber">Número</Label>
              <Input
                id="addressNumber"
                placeholder="Nº"
                value={formData.addressNumber}
                onChange={(e) => handleInputChange('addressNumber', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Plano:</span>
              <span className="font-semibold">{planName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total:</span>
              <span className="font-semibold text-lg">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(planPrice)}
              </span>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || !isValidForm()}
            className="w-full"
            size="lg"
          >
            {loading ? 'Processando...' : 'Pagar com Cartão'}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Seus dados estão protegidos e seguros
          </p>
        </form>
      </CardContent>
    </Card>
  );
};