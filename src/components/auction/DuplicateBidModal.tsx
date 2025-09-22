import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

interface DuplicateBidModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBidValue: number;
  nextAvailableValue: number;
  onConfirmNewBid: () => void;
  onCancel: () => void;
}

export const DuplicateBidModal = ({
  open,
  onOpenChange,
  currentBidValue,
  nextAvailableValue,
  onConfirmNewBid,
  onCancel
}: DuplicateBidModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border border-border shadow-2xl z-[60]">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            Lance já Coberto
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 text-center">
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <p className="text-sm text-muted-foreground">
              O lance de <span className="font-semibold text-foreground">{formatCurrency(currentBidValue)}</span> já foi realizado por outro participante.
            </p>
            <p className="text-sm text-muted-foreground">
              O próximo lance disponível é:
            </p>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(nextAvailableValue)}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={onConfirmNewBid}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              Dar Lance de {formatCurrency(nextAvailableValue)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};