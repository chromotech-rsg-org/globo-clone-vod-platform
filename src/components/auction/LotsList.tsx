import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AuctionItem, Bid } from '@/types/auction';
import { formatCurrency } from '@/utils/formatters';
import { Package, Trophy, Clock, CheckCircle } from 'lucide-react';

interface LotsListProps {
  lots: AuctionItem[];
  bids: Bid[];
  currentUserId?: string;
  currentLotId?: string;
}

const LotsList = ({ lots, bids, currentUserId, currentLotId }: LotsListProps) => {
  // Organizar lotes: em andamento → não iniciados → finalizados
  const sortedLots = [...lots].sort((a, b) => {
    // Lote atual primeiro
    if (a.id === currentLotId) return -1;
    if (b.id === currentLotId) return 1;
    
    // Depois por status
    const statusOrder = { 'in_progress': 0, 'not_started': 1, 'finished': 2 };
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    
    // Por fim, por ordem
    return a.order_index - b.order_index;
  });

  const getStatusInfo = (lot: AuctionItem) => {
    if (lot.id === currentLotId || lot.is_current) {
      return {
        label: 'EM ANDAMENTO',
        className: 'bg-green-600 text-white animate-pulse',
        icon: <CheckCircle className="h-3 w-3" />
      };
    }
    
    switch (lot.status) {
      case 'finished':
        return {
          label: 'FINALIZADO',
          className: 'bg-gray-700 text-gray-300',
          icon: <Trophy className="h-3 w-3" />
        };
      case 'in_progress':
        return {
          label: 'EM ANDAMENTO',
          className: 'bg-green-600 text-white',
          icon: <CheckCircle className="h-3 w-3" />
        };
      default:
        return {
          label: 'AGUARDANDO',
          className: 'bg-yellow-600/80 text-white',
          icon: <Clock className="h-3 w-3" />
        };
    }
  };

  const getLotWinner = (lotId: string) => {
    const winningBid = bids.find(bid => bid.auction_item_id === lotId && bid.is_winner);
    return winningBid;
  };

  if (lots.length === 0) {
    return (
      <Card className="bg-gray-900 border-green-600/30">
        <CardContent className="text-center py-8">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">Nenhum lote cadastrado para este leilão.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-green-600/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Package className="h-5 w-5 text-green-400" />
          Todos os Lotes ({lots.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedLots.map((lot, index) => {
            const statusInfo = getStatusInfo(lot);
            const winner = getLotWinner(lot.id);
            const isCurrentUserWinner = winner?.user_id === currentUserId;
            const lotNumber = lots.findIndex(l => l.id === lot.id) + 1;

            return (
              <div 
                key={lot.id}
                className={`
                  rounded-lg border transition-all duration-200 hover:shadow-lg
                  ${lot.id === currentLotId 
                    ? 'border-green-500/50 bg-green-900/20 shadow-green-500/20' 
                    : lot.status === 'finished' && isCurrentUserWinner
                    ? 'border-yellow-500/50 bg-yellow-900/20'
                    : 'border-gray-600/30 bg-gray-800/50 hover:border-gray-500/50'
                  }
                `}
              >
                <div className="p-4">
                  {/* Header do Lote */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-sm font-medium">
                        Lote {lotNumber}
                      </span>
                      <Badge className={`${statusInfo.className} flex items-center gap-1`}>
                        {statusInfo.icon}
                        {statusInfo.label}
                      </Badge>
                      {winner && isCurrentUserWinner && (
                        <Badge className="bg-yellow-500 text-black">
                          <Trophy className="h-3 w-3 mr-1" />
                          VOCÊ VENCEU!
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Imagem do Lote */}
                    <div className="md:col-span-1">
                      {lot.image_url ? (
                        <img 
                          src={lot.image_url} 
                          alt={lot.name}
                          className="w-full h-32 object-cover rounded border border-gray-600/30"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gray-700/50 rounded border border-gray-600/30 flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Informações do Lote */}
                    <div className="md:col-span-2 space-y-3">
                      <div>
                        <h4 className="text-lg font-bold text-white mb-1">{lot.name}</h4>
                        {lot.description && (
                          <p className="text-sm text-gray-300 leading-relaxed">{lot.description}</p>
                        )}
                      </div>

                      {/* Valores */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="bg-gray-700/30 rounded p-2">
                          <p className="text-xs text-gray-400 mb-1">Valor Inicial</p>
                          <p className="text-sm font-bold text-white">
                            {formatCurrency(lot.initial_value)}
                          </p>
                        </div>
                        
                        <div className="bg-gray-700/30 rounded p-2">
                          <p className="text-xs text-gray-400 mb-1">
                            {winner ? 'Valor Final' : 'Valor Atual'}
                          </p>
                          <p className={`text-sm font-bold ${
                            winner ? 'text-yellow-400' : 'text-green-400'
                          }`}>
                            {formatCurrency(winner?.bid_value || lot.current_value)}
                          </p>
                        </div>

                        {lot.increment && (
                          <div className="bg-gray-700/30 rounded p-2">
                            <p className="text-xs text-gray-400 mb-1">Incremento</p>
                            <p className="text-sm font-bold text-blue-400">
                              {formatCurrency(lot.increment)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Informações do Vencedor */}
                      {winner && (
                        <div className="bg-yellow-900/20 border border-yellow-600/30 rounded p-2">
                          <p className="text-xs text-yellow-400 mb-1">Vencedor</p>
                          <p className="text-sm font-medium text-white">
                            {isCurrentUserWinner ? 'Você' : 'Usuário'} • {formatCurrency(winner.bid_value)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default LotsList;