import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, Copy, Check } from 'lucide-react';
import { useAsaasPayment } from '@/hooks/useAsaasPayment';
import { CreatePaymentResponse } from '@/types/asaas';

interface BoletoPaymentFormProps {
  customerId: string;
  planId: string;
  planName: string;
  planPrice: number;
  onSuccess: (payment: CreatePaymentResponse) => void;
  onError: (error: string) => void;
}

export const BoletoPaymentForm = ({
  customerId,
  planId,
  planName,
  planPrice,
  onSuccess,
  onError,
}: BoletoPaymentFormProps) => {
  const [payment, setPayment] = useState<CreatePaymentResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const { loading, createPayment } = useAsaasPayment();

  const handleGenerateBoleto = async () => {
    try {
      const result = await createPayment({
        customerId,
        planId,
        paymentMethod: 'BOLETO',
      });

      setPayment(result);
      onSuccess(result);
    } catch (error: any) {
      onError(error.message);
    }
  };

  const handleCopyBarcode = async () => {
    if (payment?.identificationField) {
      await navigator.clipboard.writeText(payment.identificationField);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (payment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Boleto Gerado
          </CardTitle>
          <CardDescription>
            O boleto foi gerado com sucesso. Você pode visualizá-lo e fazer o download.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
              <span className="text-sm text-muted-foreground">Vencimento:</span>
              <span className="font-semibold">
                {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>

          {payment.identificationField && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Código de Barras:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={payment.identificationField}
                  readOnly
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyBarcode}
                  title="Copiar código"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {payment.bankSlipUrl && (
              <>
                <Button asChild className="w-full">
                  <a href={payment.bankSlipUrl} target="_blank" rel="noopener noreferrer">
                    <FileText className="mr-2 h-4 w-4" />
                    Visualizar Boleto
                  </a>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <a href={payment.bankSlipUrl} download>
                    <Download className="mr-2 h-4 w-4" />
                    Baixar Boleto (PDF)
                  </a>
                </Button>
              </>
            )}
          </div>

          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="font-medium mb-2">Instruções:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>O boleto vence em 7 dias</li>
              <li>Após o pagamento, pode levar até 2 dias úteis para compensação</li>
              <li>Você receberá um e-mail de confirmação quando o pagamento for identificado</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Pagamento via Boleto
        </CardTitle>
        <CardDescription>
          Gere o boleto bancário para o plano {planName}
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

        <Button
          onClick={handleGenerateBoleto}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? 'Gerando boleto...' : 'Gerar Boleto Bancário'}
        </Button>

        <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-2">Sobre o pagamento:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Boleto com vencimento em 7 dias</li>
            <li>Compensação em até 2 dias úteis</li>
            <li>Confirmação por e-mail após o pagamento</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};