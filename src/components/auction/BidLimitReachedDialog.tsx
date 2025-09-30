import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { RequestLimitIncreaseDialog } from './RequestLimitIncreaseDialog';

interface BidLimitReachedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLimit: number;
  totalBidsUsed: number;
  attemptedBidValue: number;
  userId: string;
  auctionId: string;
  auctionItemId: string;
  onRequestSent?: () => void;
}

export function BidLimitReachedDialog({
  open,
  onOpenChange,
  currentLimit,
  totalBidsUsed,
  attemptedBidValue,
  userId,
  auctionId,
  auctionItemId,
  onRequestSent
}: BidLimitReachedDialogProps) {
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  
  const remainingLimit = currentLimit - totalBidsUsed;
  const exceedsBy = (totalBidsUsed + attemptedBidValue) - currentLimit;

  const handleRequestIncrease = () => {
    onOpenChange(false);
    setShowRequestDialog(true);
  };

  return (
    <>
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent className="bg-gray-900 border-red-500/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-5 w-5" />
              Limite de Lance Atingido
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300 space-y-4">
              <div className="bg-gray-800 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Limite atual:</span>
                  <span className="text-white font-bold">{formatCurrency(currentLimit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total usado:</span>
                  <span className="text-yellow-400 font-medium">{formatCurrency(totalBidsUsed)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Disponível:</span>
                  <span className="text-green-400 font-medium">{formatCurrency(remainingLimit)}</span>
                </div>
                <div className="border-t border-gray-700 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Lance tentado:</span>
                    <span className="text-red-400 font-bold">{formatCurrency(attemptedBidValue)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-500">Excede em:</span>
                    <span className="text-red-300">{formatCurrency(exceedsBy)}</span>
                  </div>
                </div>
              </div>
              
              <p className="text-center text-gray-400">
                Você não possui saldo suficiente para fazer este lance.
                Solicite um aumento de limite ao administrador.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 hover:bg-gray-600">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRequestIncrease}
              className="bg-green-600 hover:bg-green-700"
            >
              Solicitar Aumento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RequestLimitIncreaseDialog
        open={showRequestDialog}
        onOpenChange={setShowRequestDialog}
        userId={userId}
        currentLimit={currentLimit}
        suggestedLimit={currentLimit + Math.ceil(exceedsBy / 1000) * 1000}
        onRequestSent={onRequestSent}
      />
    </>
  );
}
