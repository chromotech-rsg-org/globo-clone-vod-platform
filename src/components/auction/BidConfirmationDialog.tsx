import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Auction } from '@/types/auction';
import { formatCurrency } from '@/utils/formatters';
import { AlertTriangle, Gavel } from 'lucide-react';
interface BidConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auction: Auction;
  bidValue: number;
  onConfirm: () => void;
}
const BidConfirmationDialog = ({
  open,
  onOpenChange,
  auction,
  bidValue,
  onConfirm
}: BidConfirmationDialogProps) => {
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="text-primary" size={20} />
            Confirmação de Lance
          </DialogTitle>
          <DialogDescription>
            Revise as informações do seu lance antes de confirmar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Leilão</p>
                <p className="font-semibold">{auction.name}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Lance Atual</p>
                  <p className="font-semibold text-muted-foreground">
                    {formatCurrency(auction.current_bid_value)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Seu Lance</p>
                  <p className="text-lg font-bold text-primary">
                    {formatCurrency(bidValue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-600 dark:text-amber-400 mt-0.5" size={18} />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                  Atenção
                </p>
                <p className="text-amber-700 dark:text-amber-300">
                  Seu lance será enviado para análise e aprovação. Você será notificado sobre o resultado.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-slate-950">
            Cancelar
          </Button>
          <Button onClick={onConfirm} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Confirmar Lance
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
};
export default BidConfirmationDialog;