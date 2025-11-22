import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, Copy, Check, RefreshCw } from 'lucide-react';
import { useAsaasPayment } from '@/hooks/useAsaasPayment';
import { usePaymentStatus } from '@/hooks/usePaymentStatus';
import { CreatePaymentResponse } from '@/types/asaas';

interface PixPaymentFormProps {
  customerId: string;
  planId: string;
  planName: string;
  planPrice: number;
  onSuccess: (payment: CreatePaymentResponse) => void;
  onError: (error: string) => void;
}

export const PixPaymentForm = ({
  customerId,
  planId,
  planName,
  planPrice,
  onSuccess,
  onError,
}: PixPaymentFormProps) => {
  const [payment, setPayment] = useState<CreatePaymentResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const { loading, createPayment } = useAsaasPayment();
  const { payment: paymentStatus } = usePaymentStatus(
    payment?.internalPaymentId || null,
    5000
  );

  useEffect(() => {
    if (paymentStatus?.status === 'RECEIVED' || paymentStatus?.status === 'CONFIRMED') {
      onSuccess(payment!);
    }
  }, [paymentStatus?.status]);

  const handleGeneratePix = async () => {
    try {
      const result = await createPayment({
        customerId,
        planId,
        paymentMethod: 'PIX',
      });

      setPayment(result);
    } catch (error: any) {
      onError(error.message);
    }
  };

  const handleCopyPixCode = async () => {
    if (payment?.pixCopyPaste) {
      await navigator.clipboard.writeText(payment.pixCopyPaste);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (payment) {
    const isPaid =
      paymentStatus?.status === 'RECEIVED' || paymentStatus?.status === 'CONFIRMED';

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            {isPaid ? 'Pagamento Confirmado!' : 'PIX Gerado'}
          </CardTitle>
          <CardDescription>
            {isPaid
              ? 'Seu pagamento foi confirmado com sucesso'
              : 'Escaneie o QR Code ou copie o código para pagar'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isPaid && (
            <>
              {payment.pixQrCode && (
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <img
                    src={`data:image/png;base64,${payment.pixQrCode}`}
                    alt="QR Code PIX"
                    className="max-w-[300px] w-full"
                  />
                </div>
              )}

              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Valor:</span>
                  <span className="font-semibold">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(planPrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-orange-500">Aguardando pagamento</span>
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  </div>
                </div>
              </div>

              {payment.pixCopyPaste && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Código PIX Copia e Cola:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={payment.pixCopyPaste}
                      readOnly
                      className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-ellipsis overflow-hidden"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyPixCode}
                      title="Copiar código"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}

              <div className="rounded-lg bg-muted p-4 text-sm">
                <p className="font-medium mb-2">Como pagar:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Abra o app do seu banco</li>
                  <li>Escolha a opção PIX</li>
                  <li>Escaneie o QR Code ou cole o código</li>
                  <li>Confirme o pagamento</li>
                  <li>Aguarde a confirmação automática</li>
                </ul>
              </div>
            </>
          )}

          {isPaid && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-6 text-center">
              <Check className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <p className="text-lg font-semibold text-green-900 mb-2">
                Pagamento Confirmado!
              </p>
              <p className="text-sm text-green-700">
                Sua assinatura foi ativada com sucesso.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Pagamento via PIX
        </CardTitle>
        <CardDescription>
          Gere o QR Code PIX para o plano {planName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Plano:</span>
            <span className="font-semibold">{planName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Valor:</span>
            <span className="font-semibold text-lg">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(planPrice)}
            </span>
          </div>
        </div>

        <Button onClick={handleGeneratePix} disabled={loading} className="w-full" size="lg">
          {loading ? 'Gerando PIX...' : 'Gerar QR Code PIX'}
        </Button>

        <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-2">Vantagens do PIX:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Pagamento instantâneo</li>
            <li>Confirmação automática em segundos</li>
            <li>Disponível 24h, todos os dias</li>
            <li>Sem taxas adicionais</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};