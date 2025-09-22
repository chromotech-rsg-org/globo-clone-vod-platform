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
      <DialogContent className="sm:max-w-md bg-background border border-border shadow-2xl z-[70]">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-blue-500" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            Lance Superado
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 text-center">
          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <p className="text-sm text-muted-foreground">
              Sua intenção de lance foi superada por outro participante.
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Lance pretendido:</span>
                <span className="font-semibold line-through text-muted-foreground">
                  {formatCurrency(originalBidValue)}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Novo lance mínimo:</span>
                <span className="font-bold text-primary text-lg">
                  {formatCurrency(newBidValue)}
                </span>
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-3">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Mudança automática:</strong> O valor foi ajustado automaticamente para o próximo lance válido.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 gap-2"
            >
              <X className="w-4 h-4" />
              Cancelar
            </Button>
            <Button
              onClick={onProceed}
              className="flex-1 bg-primary hover:bg-primary/90 gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              OK, Prosseguir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};