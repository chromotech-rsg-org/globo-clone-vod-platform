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
  currentValue?: number;
  onConfirm: () => void;
}
const BidConfirmationDialog = ({
  open,
  onOpenChange,
  auction,
  bidValue,
  currentValue,
  onConfirm
}: BidConfirmationDialogProps) => {
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-black border-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Gavel className="text-green-400" size={20} />
            Confirmação de Lance
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Revise as informações do seu lance antes de confirmar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4 space-y-3">
              <div>
                <p className="text-sm text-gray-400">Leilão</p>
                <p className="font-semibold text-white">{auction.name}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Lance Atual</p>
          <p className="font-semibold text-gray-300">
            {formatCurrency(currentValue ?? auction.current_bid_value)}
          </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Seu Lance</p>
                  <p className="text-lg font-bold text-green-400">
                    {formatCurrency(bidValue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-green-950/30 border border-green-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-green-400 mt-0.5" size={18} />
              <div className="text-sm">
                <p className="font-medium text-green-300 mb-1">
                  Atenção
                </p>
                <p className="text-green-200">Seu lance será enviado. Confirme se o valor está correto, pois o arremate pode ocorrer nesse valor.</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-600 hover:bg-gray-800 text-zinc-50">
            Cancelar
          </Button>
          <Button onClick={onConfirm} className="bg-green-600 hover:bg-green-700 text-white">
            Confirmar Lance
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
};
export default BidConfirmationDialog;