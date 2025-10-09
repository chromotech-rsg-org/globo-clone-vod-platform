import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from '@/utils/formatters';
import { useBidLimits } from '@/hooks/useBidLimits';
import { TrendingUp } from 'lucide-react';
import CurrencyInput from '@/components/ui/currency-input';
import { toast } from '@/hooks/use-toast';

interface RequestLimitIncreaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  currentLimit: number;
  suggestedLimit?: number;
  onRequestSent?: () => void;
}

export function RequestLimitIncreaseDialog({
  open,
  onOpenChange,
  userId,
  currentLimit,
  suggestedLimit,
  onRequestSent
}: RequestLimitIncreaseDialogProps) {
  const [requestedLimit, setRequestedLimit] = useState(suggestedLimit || currentLimit * 2);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { requestLimitIncrease } = useBidLimits();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (requestedLimit <= currentLimit) {
      alert('O limite solicitado deve ser maior que o limite atual');
      return;
    }

    setSubmitting(true);
    try {
      await requestLimitIncrease(userId, currentLimit, requestedLimit, reason);
      toast({
        title: "Solicitação enviada!",
        description: "Sua solicitação de aumento de limite foi enviada e será analisada pelo administrador.",
      });
      onOpenChange(false);
      setReason('');
      if (onRequestSent) {
        onRequestSent();
      }
    } catch (error) {
      console.error('Error requesting limit increase:', error);
      toast({
        title: "Erro ao enviar solicitação",
        description: "Ocorreu um erro ao enviar sua solicitação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-green-500/30 max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <TrendingUp className="h-5 w-5 text-green-400" />
            Solicitar Aumento de Limite
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Preencha os dados abaixo para solicitar um aumento no seu limite de lances
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Limite Atual</Label>
              <Input
                type="text"
                value={formatCurrency(currentLimit)}
                disabled
                className="bg-gray-800 border-gray-700 text-gray-400"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Novo Limite Solicitado *</Label>
              <CurrencyInput
                value={requestedLimit}
                onChange={(value) => setRequestedLimit(value)}
                placeholder="R$ 0,00"
                disabled={submitting}
                className="bg-gray-800 border-gray-700 text-white"
              />
              <p className="text-xs text-gray-500">
                Mínimo: {formatCurrency(currentLimit + 1000)}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Justificativa</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white min-h-[100px] resize-none"
                placeholder="Explique o motivo da solicitação de aumento (opcional)"
              />
            </div>

            <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-500/30">
              <p className="text-sm text-blue-300">
                ℹ️ Sua solicitação será analisada pelo administrador. Você receberá uma notificação quando for aprovada ou rejeitada.
              </p>
            </div>
          </form>
        </ScrollArea>

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="bg-gray-800 hover:bg-gray-700"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700"
          >
            {submitting ? 'Enviando...' : 'Enviar Solicitação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
