import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AuctionItem, Bid } from '@/types/auction';
import { formatCurrency } from '@/utils/formatters';
import { Package, CheckCircle, Clock, Trophy } from 'lucide-react';

interface AuctionStatusSummaryProps {
  lots: AuctionItem[];
  bids: Bid[];
  currentUserId?: string;
}

const AuctionStatusSummary = ({ lots, bids, currentUserId }: AuctionStatusSummaryProps) => {
  const notStartedLots = lots.filter(lot => lot.status === 'not_started');
  const finishedLots = lots.filter(lot => lot.status === 'finished');
  const nextLot = notStartedLots.sort((a, b) => a.order_index - b.order_index)[0];
  
  // Calcular vencedores por lote
  const winners = finishedLots.map(lot => {
    const lotBids = bids.filter(bid => bid.auction_item_id === lot.id && bid.is_winner);
    const winningBid = lotBids[0];
    return {
      lot,
      winningBid,
      isCurrentUser: winningBid?.user_id === currentUserId
    };
  });

  return (
    <Card className="bg-black border-green-600/30 h-full flex flex-col">
      <CardHeader className="text-center">
        <CardTitle className="text-white flex items-center justify-center gap-2">
          <Package className="h-6 w-6 text-gray-400" />
          Status do Leilão
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 flex-1 overflow-y-auto">
        {/* Status Geral */}
        <div className="text-center">
          <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
            <h3 className="text-xl font-bold text-white mb-2">Nenhum Lote em Andamento</h3>
            <p className="text-gray-300">
              {finishedLots.length} de {lots.length} lotes finalizados
            </p>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-800/30 rounded-lg p-3 text-center">
              <CheckCircle className="h-6 w-6 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Finalizados</p>
              <p className="text-lg font-bold text-white">{finishedLots.length}</p>
            </div>
            
            <div className="bg-gray-800/30 rounded-lg p-3 text-center">
              <Clock className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Aguardando</p>
              <p className="text-lg font-bold text-white">{notStartedLots.length}</p>
            </div>
            
            <div className="bg-gray-800/30 rounded-lg p-3 text-center">
              <Package className="h-6 w-6 text-blue-400 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Total</p>
              <p className="text-lg font-bold text-white">{lots.length}</p>
            </div>
          </div>
        </div>

        {/* Próximo Lote */}
        {nextLot && (
          <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-400" />
              Próximo Lote
            </h4>
            <div className="flex items-center gap-3">
              {nextLot.image_url && (
                <img 
                  src={nextLot.image_url} 
                  alt={nextLot.name}
                  className="w-12 h-12 object-cover rounded border border-blue-600/30"
                />
              )}
              <div className="flex-1">
                <p className="text-white font-medium">{nextLot.name}</p>
                <p className="text-sm text-gray-400">
                  Valor inicial: {formatCurrency(nextLot.initial_value)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Resumo de Lotes Finalizados */}
        {winners.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-white font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-400" />
              Lotes Finalizados ({winners.length})
            </h4>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {winners.map(({ lot, winningBid, isCurrentUser }) => (
                <div 
                  key={lot.id}
                  className={`bg-gray-800/30 rounded p-3 border ${
                    isCurrentUser ? 'border-green-500/50 bg-green-900/20' : 'border-gray-600/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-white font-medium">{lot.name}</p>
                      <p className="text-sm text-gray-400">
                        {isCurrentUser ? 'Você venceu!' : 'Vencedor: Usuário'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-bold">
                        {formatCurrency(winningBid?.bid_value || lot.current_value)}
                      </p>
                      {isCurrentUser && (
                        <Badge className="bg-green-600 text-white text-xs">
                          <Trophy className="h-3 w-3 mr-1" />
                          Vencedor
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mensagem quando todos finalizados */}
        {lots.length > 0 && finishedLots.length === lots.length && (
          <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-4 text-center">
            <Trophy className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <h4 className="text-green-400 font-bold text-lg mb-1">Leilão Finalizado</h4>
            <p className="text-gray-300">Todos os lotes foram arrematados!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuctionStatusSummary;