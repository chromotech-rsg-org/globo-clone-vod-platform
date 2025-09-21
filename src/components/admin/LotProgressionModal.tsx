import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, PlayCircle, XCircle } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

interface LotProgressionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  winningBid?: {
    bid_value: number;
    user_name?: string;
  };
  currentLot?: {
    id: string;
    name: string;
  };
  nextLot?: {
    id: string;
    name: string;
  };
  hasNextLot: boolean;
  onStartNextLot: () => void;
  onSkipNextLot: () => void;
  loading?: boolean;
}

export const LotProgressionModal = ({
  open,
  onOpenChange,
  winningBid,
  currentLot,
  nextLot,
  hasNextLot,
  onStartNextLot,
  onSkipNextLot,
  loading = false
}: LotProgressionModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-black border-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Lote Finalizado
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            O lote atual foi finalizado com sucesso
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Winning Bid Info */}
          {winningBid && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="text-center">
                <p className="text-sm text-green-400 mb-1">Lance Vencedor</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(winningBid.bid_value)}
                </p>
                {winningBid.user_name && (
                  <p className="text-sm text-gray-300 mt-2">
                    Vencedor: {winningBid.user_name}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Current Lot Info */}
          {currentLot && (
            <div className="bg-gray-800/50 rounded-lg p-3">
              <p className="text-sm text-gray-400">Lote Finalizado:</p>
              <p className="font-medium text-white">{currentLot.name}</p>
            </div>
          )}

          {/* Next Lot Options */}
          {hasNextLot && nextLot ? (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-sm text-blue-400 mb-2">Próximo Lote Disponível:</p>
              <p className="font-medium text-white mb-4">{nextLot.name}</p>
              
              <div className="flex gap-2">
                <Button
                  onClick={onStartNextLot}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  {loading ? 'Iniciando...' : 'Iniciar Próximo'}
                </Button>
                
                <Button
                  onClick={onSkipNextLot}
                  variant="outline"
                  disabled={loading}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Pular
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
              <p className="text-yellow-400">
                🎉 Todos os lotes foram finalizados!
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Não há mais lotes disponíveis neste leilão.
              </p>
            </div>
          )}

          {/* Close Button */}
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
            disabled={loading}
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};