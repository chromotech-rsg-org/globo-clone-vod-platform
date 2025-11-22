import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2, Clock } from 'lucide-react';
import { PaymentStatus } from '@/types/asaas';

interface PaymentStatusModalProps {
  open: boolean;
  onClose: () => void;
  status: 'processing' | 'success' | 'error' | 'pending';
  paymentStatus?: PaymentStatus;
  message?: string;
}

export const PaymentStatusModal = ({
  open,
  onClose,
  status,
  paymentStatus,
  message,
}: PaymentStatusModalProps) => {
  const getIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />;
      case 'success':
        return <Check className="h-16 w-16 text-green-600" />;
      case 'error':
        return <X className="h-16 w-16 text-red-600" />;
      case 'pending':
        return <Clock className="h-16 w-16 text-orange-600" />;
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'processing':
        return 'Processando pagamento...';
      case 'success':
        return 'Pagamento confirmado!';
      case 'error':
        return 'Erro no pagamento';
      case 'pending':
        return 'Aguardando pagamento';
    }
  };

  const getDescription = () => {
    if (message) return message;

    switch (status) {
      case 'processing':
        return 'Por favor, aguarde enquanto processamos seu pagamento.';
      case 'success':
        return 'Seu pagamento foi processado com sucesso. Sua assinatura está ativa!';
      case 'error':
        return 'Não foi possível processar seu pagamento. Por favor, tente novamente.';
      case 'pending':
        return 'Realize o pagamento para ativar sua assinatura.';
    }
  };

  const getBgColor = () => {
    switch (status) {
      case 'processing':
        return 'bg-blue-50 border-blue-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'pending':
        return 'bg-orange-50 border-orange-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">{getTitle()}</DialogTitle>
          <DialogDescription className="text-center">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>
        
        <div className={`rounded-lg border p-8 text-center ${getBgColor()}`}>
          <div className="flex justify-center mb-4">{getIcon()}</div>
          
          {paymentStatus && (
            <p className="text-sm text-muted-foreground">
              Status: {paymentStatus}
            </p>
          )}
        </div>

        {status !== 'processing' && (
          <div className="flex justify-center">
            <Button onClick={onClose}>
              {status === 'success' ? 'Ir para Dashboard' : 'Fechar'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};