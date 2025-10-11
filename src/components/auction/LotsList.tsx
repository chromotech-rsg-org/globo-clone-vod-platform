import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AuctionItem, Bid } from '@/types/auction';
import { formatCurrency } from '@/utils/formatters';
import { Package, Trophy, Clock, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface LotsListProps {
  lots: AuctionItem[];
  bids: Bid[];
  currentUserId?: string;
  currentLotId?: string;
}

const LotsList = ({ lots, bids, currentUserId, currentLotId }: LotsListProps) => {
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  
  const toggleDescription = (lotId: string) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lotId)) {
        newSet.delete(lotId);
      } else {
        newSet.add(lotId);
      }
      return newSet;
    });
  };
  // Organizar lotes: em andamento → não iniciados → finalizados
  const sortedLots = [...lots].sort((a, b) => {
    // Lote atual primeiro
    if (a.id === currentLotId) return -1;
    if (b.id === currentLotId) return 1;
    
    // Depois por status
    const statusOrder = { 'in_progress': 0, 'pre_bidding': 1, 'not_started': 2, 'finished': 3 } as const;
    const rankA = (statusOrder as any)[a.status] ?? 99;
    const rankB = (statusOrder as any)[b.status] ?? 99;
    const statusDiff = rankA - rankB;
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
      case 'pre_bidding':
        return {
          label: 'PRÉ-LANCE',
          className: 'bg-blue-600/80 text-white',
          icon: <Clock className="h-3 w-3" />
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
      <Card className="bg-black border-green-600/30">
        <CardContent className="text-center py-8 bg-black">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">Nenhum lote cadastrado para este leilão.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black border-green-600/30 h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Package className="h-5 w-5 text-green-400" />
          Todos os Lotes ({lots.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="bg-black flex-1 overflow-y-auto">
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
                    : 'border-gray-600/30 bg-black hover:border-gray-500/50'
                  }
                `}
              >
                <div className="p-4">
                  {/* Header do Lote */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                       <span className="bg-black text-gray-300 px-2 py-1 rounded text-sm font-medium">
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

                  {/* Layout Desktop - Horizontal */}
                  <div className="hidden md:flex gap-6">
                    {/* Imagem do Lote - Maior e mais proeminente */}
                    <div className="flex-shrink-0">
                      {lot.image_url ? (
                        <div className="relative">
                          <img 
                            src={lot.image_url} 
                            alt={lot.name}
                            className="w-40 h-40 object-cover rounded-lg border-2 border-gray-600/50 shadow-lg"
                          />
                          <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/20 to-transparent" />
                        </div>
                      ) : (
                         <div className="w-40 h-40 bg-black/50 rounded-lg border-2 border-gray-600/50 flex items-center justify-center">
                           <Package className="h-12 w-12 text-gray-400" />
                         </div>
                      )}
                    </div>

                    {/* Informações do Lote */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <h4 className="text-lg font-bold text-white mb-1">{lot.name}</h4>
                        {lot.description && (
                          <div className="space-y-2">
                            <p 
                              className={`text-sm text-gray-300 leading-relaxed cursor-pointer transition-all duration-200 ${
                                !expandedDescriptions.has(lot.id) 
                                  ? 'line-clamp-3 hover:text-white' 
                                  : ''
                              }`}
                              onClick={() => toggleDescription(lot.id)}
                            >
                              {lot.description}
                            </p>
                            {lot.description.length > 120 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleDescription(lot.id)}
                                className="p-0 h-auto text-gray-400 hover:text-white text-sm"
                              >
                                {expandedDescriptions.has(lot.id) ? (
                                  <>
                                    <ChevronUp className="h-4 w-4 mr-1" />
                                    Mostrar menos
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-4 w-4 mr-1" />
                                    Mostrar mais
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        )}
                        </div>

                      {/* Valores */}
                      <div className="grid grid-cols-3 gap-3">
                         <div className="bg-black rounded p-2 overflow-hidden">
                           <p className="text-xs text-gray-400 mb-1 truncate">Valor Inicial</p>
                           <p className="text-sm font-bold text-white truncate">
                             {formatCurrency(lot.initial_value)}
                           </p>
                         </div>
                         
                         <div className="bg-black rounded p-2 overflow-hidden">
                           <p className="text-xs text-gray-400 mb-1 truncate">
                             {winner ? 'Valor Final' : 'Valor Atual'}
                           </p>
                           <p className={`text-sm font-bold truncate ${
                             winner ? 'text-yellow-400' : 'text-green-400'
                           }`}>
                             {formatCurrency(winner?.bid_value || lot.current_value)}
                           </p>
                         </div>

                         {lot.increment && (
                           <div className="bg-black rounded p-2 overflow-hidden">
                             <p className="text-xs text-gray-400 mb-1 truncate">Incremento</p>
                             <p className="text-sm font-bold text-blue-400 truncate">
                               {formatCurrency(lot.increment)}
                             </p>
                           </div>
                         )}
                      </div>

                      {/* Informações do Vencedor */}
                      {winner && (
                        <div className="bg-yellow-900/20 border border-yellow-600/30 rounded p-2 overflow-hidden">
                          <p className="text-xs text-yellow-400 mb-1 truncate">Vencedor</p>
                          <p className="text-sm font-medium text-white truncate">
                            {isCurrentUserWinner ? 'Você' : 'Investidor'} • {formatCurrency(winner.bid_value)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Layout Mobile - Vertical com cards clicáveis */}
                  <div className="md:hidden space-y-3">
                    {/* Card compacto - clicável */}
                    <div 
                      className="cursor-pointer" 
                      onClick={() => toggleDescription(lot.id)}
                    >
                      <div className="flex items-center gap-3">
                        {/* Thumbnail pequena */}
                        <div className="flex-shrink-0">
                          {lot.image_url ? (
                            <img 
                              src={lot.image_url} 
                              alt={lot.name}
                              className="w-16 h-16 object-cover rounded border border-gray-600/50"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-black/50 rounded border border-gray-600/50 flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        {/* Informações compactas */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-white truncate">{lot.name}</h4>
                          <p className={`text-base font-bold ${winner ? 'text-yellow-400' : 'text-green-400'}`}>
                            {formatCurrency(winner?.bid_value || lot.current_value)}
                          </p>
                        </div>

                        {/* Ícone expandir/recolher */}
                        <div className="flex-shrink-0">
                          {expandedDescriptions.has(lot.id) ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Detalhes expandidos */}
                    {expandedDescriptions.has(lot.id) && (
                      <div className="space-y-3 pt-2 border-t border-gray-700">
                        {/* Imagem grande */}
                        <div className="flex justify-center">
                          {lot.image_url ? (
                            <div className="relative w-full max-w-[280px]">
                              <img 
                                src={lot.image_url} 
                                alt={lot.name}
                                className="w-full h-auto aspect-square object-cover rounded-lg border-2 border-gray-600/50 shadow-lg"
                              />
                              <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/20 to-transparent" />
                            </div>
                          ) : (
                            <div className="w-full max-w-[280px] aspect-square bg-black/50 rounded-lg border-2 border-gray-600/50 flex items-center justify-center">
                              <Package className="h-16 w-16 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Descrição completa */}
                        {lot.description && (
                          <p className="text-sm text-gray-300 leading-relaxed">
                            {lot.description}
                          </p>
                        )}

                        {/* Valores detalhados */}
                        <div className="space-y-2">
                          <div className="bg-black rounded p-3">
                            <p className="text-xs text-gray-400 mb-1">Valor Inicial</p>
                            <p className="text-base font-bold text-white">
                              {formatCurrency(lot.initial_value)}
                            </p>
                          </div>
                          
                          <div className="bg-black rounded p-3">
                            <p className="text-xs text-gray-400 mb-1">
                              {winner ? 'Valor Final' : 'Valor Atual'}
                            </p>
                            <p className={`text-base font-bold ${
                              winner ? 'text-yellow-400' : 'text-green-400'
                            }`}>
                              {formatCurrency(winner?.bid_value || lot.current_value)}
                            </p>
                          </div>

                          {lot.increment && (
                            <div className="bg-black rounded p-3">
                              <p className="text-xs text-gray-400 mb-1">Incremento</p>
                              <p className="text-base font-bold text-blue-400">
                                {formatCurrency(lot.increment)}
                              </p>
                            </div>
                          )}

                          {/* Informações do Vencedor */}
                          {winner && (
                            <div className="bg-yellow-900/20 border border-yellow-600/30 rounded p-3">
                              <p className="text-xs text-yellow-400 mb-1">Vencedor</p>
                              <p className="text-sm font-medium text-white">
                                {isCurrentUserWinner ? 'Você' : 'Investidor'} • {formatCurrency(winner.bid_value)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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