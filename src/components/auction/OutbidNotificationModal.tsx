import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TrendingUp, X } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

interface OutbidNotificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalBidValue: number;
  newBidValue: number;
  onProceed: () => void;
  onCancel: () => void;
}

export const OutbidNotificationModal = ({
  open,
  onOpenChange,
  originalBidValue,
  newBidValue,
  onProceed,
  onCancel
}: OutbidNotificationModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-md border border-amber-500/30 shadow-2xl z-[80] outline-none">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full flex items-center justify-center ring-4 ring-amber-500/30">
            <TrendingUp className="w-8 h-8 text-amber-500" />
          </div>
          <DialogTitle className="text-2xl font-bold text-foreground">
            Lance Superado
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 text-center">
          <div className="p-6 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl border border-amber-200/30 dark:border-amber-800/30 space-y-4">
            <p className="text-foreground font-medium text-lg">
              Sua intenção de lance foi superada por outro participante
            </p>
            
            <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Lance pretendido:</span>
                <span className="font-semibold line-through text-red-500 text-lg">
                  {formatCurrency(originalBidValue)}
                </span>
              </div>
              
              <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent"></div>
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Novo lance mínimo:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 text-2xl">
                  {formatCurrency(newBidValue)}
                </span>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/50 dark:border-blue-800/30 rounded-lg p-4">
              <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                <strong>✨ Mudança Automática:</strong><br />
                O valor foi ajustado automaticamente para o próximo lance válido conforme as regras do leilão.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 gap-2 h-12 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              <X className="w-5 h-5" />
              Cancelar
            </Button>
            <Button
              onClick={onProceed}
              className="flex-1 gap-2 h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg"
            >
              <TrendingUp className="w-5 h-5" />
              OK, Prosseguir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};