import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuctionItem, Auction, Bid, BidUserState } from '@/types/auction';
import { formatCurrency } from '@/utils/formatters';
import { Hash, Plus, Minus, X, AlertTriangle, Trophy, PlayCircle, AlertCircle, Clock, Gavel, ChevronDown, ChevronUp } from "lucide-react";

interface CurrentLotDisplayProps {
  currentLot: AuctionItem;
  auction: Auction;
  bids: Bid[];
  customIncrement: number;
  onIncrementChange: (newIncrement: number) => void;
  nextBidValue: number;
  onBidClick: () => void;
  canBid: boolean;
  userState: BidUserState;
  stateInfo: any;
  submittingBid: boolean;
  userPendingBid: Bid | null;
  userId?: string;
  onRequestRegistration: () => void;
}

const CurrentLotDisplay = ({ 
  currentLot, 
  auction, 
  bids, 
  customIncrement,
  onIncrementChange,
  nextBidValue,
  onBidClick,
  canBid,
  userState,
  stateInfo,
  submittingBid,
  userPendingBid,
  userId,
  onRequestRegistration
}: CurrentLotDisplayProps) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  const baseIncrement = Number(currentLot.increment ?? auction.bid_increment);
  const currentBidValue = Math.max(
    currentLot.current_value,
    ...bids.filter(bid => bid.auction_item_id === currentLot.id && bid.status === 'approved')
           .map(bid => bid.bid_value)
  );
  
  const minIncrement = baseIncrement;

  const handleIncrementDecrease = () => {
    const newIncrement = Math.max(minIncrement, customIncrement - baseIncrement);
    onIncrementChange(newIncrement);
  };

  const handleIncrementIncrease = () => {
    const newIncrement = customIncrement + baseIncrement;
    onIncrementChange(newIncrement);
  };

  return (
    <Card className="bg-black border-green-500/50 shadow-xl">
      <CardHeader className="text-center">
        {/* Status do Lote */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Hash className="h-5 w-5 text-gray-400" />
              <span className="text-lg font-semibold text-white">
                Lote {((currentLot.order_index || 0) + 1).toString().padStart(3, '0')}
              </span>
            </div>
            {currentLot.status === 'finished' && (
              <Badge variant="destructive" className="bg-red-600/20 text-red-400 border-red-600/30">
                <X className="h-3 w-3 mr-1" />
                Finalizado
              </Badge>
            )}
            {currentLot.status === 'in_progress' && (
              <Badge className="bg-green-600/20 text-green-400 border-green-600/30">
                <PlayCircle className="h-3 w-3 mr-1" />
                Em Andamento
              </Badge>
            )}
          </div>
        </div>

        <CardTitle className="text-white flex items-center justify-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-400" />
          <span>{currentLot.name}</span>
          {currentLot.status === 'in_progress' && (
            <Badge className="bg-green-600 text-white animate-pulse">
              EM ANDAMENTO
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Imagem e Nome do Lote */}
        <div className="text-center">
          {currentLot.image_url && (
            <div className="mx-auto w-48 h-48 mb-4 overflow-hidden rounded-lg border-2 border-green-500/30">
              <img 
                src={currentLot.image_url} 
                alt={currentLot.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <h3 className="text-2xl font-bold text-white mb-2">{currentLot.name}</h3>
          {currentLot.description && (
            <div className="space-y-2">
              <p 
                className={`text-gray-300 leading-relaxed cursor-pointer transition-all duration-200 ${
                  !isDescriptionExpanded 
                    ? 'line-clamp-1 hover:text-white' 
                    : ''
                }`}
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              >
                {currentLot.description}
              </p>
              {currentLot.description.length > 80 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="p-0 h-auto text-gray-400 hover:text-white text-sm"
                >
                  {isDescriptionExpanded ? (
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

        {/* Valores do Lote */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-400 mb-1">Valor Inicial</p>
            <p className="text-lg font-bold text-white">
              {formatCurrency(currentLot.initial_value)}
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-400 mb-1">Lance Atual</p>
            <p className="text-xl font-bold text-green-400">
              {formatCurrency(currentBidValue)}
            </p>
          </div>
        </div>

        {/* Controles de Incremento */}
        <div className={`rounded-lg p-4 ${auction.status === 'inactive' || !auction.is_live ? 'bg-gray-900/50' : 'bg-gray-800/30'}`}>
          <p className={`text-sm mb-3 text-center ${auction.status === 'inactive' || !auction.is_live ? 'text-gray-500' : 'text-gray-400'}`}>Incremento de Lance</p>
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleIncrementDecrease}
            disabled={customIncrement <= minIncrement || auction.status === 'inactive' || !auction.is_live || currentLot.status === 'finished'}
              className="h-8 w-8 p-0 border-gray-600 hover:border-gray-500 disabled:opacity-30"
            >
              <Minus className="h-4 w-4" />
            </Button>
            
            <div className={`rounded-lg px-4 py-2 min-w-[120px] text-center ${auction.status === 'inactive' || !auction.is_live ? 'bg-gray-900/80' : 'bg-gray-900'}`}>
              <p className={`text-sm ${auction.status === 'inactive' || !auction.is_live ? 'text-gray-500' : 'text-gray-400'}`}>Incremento</p>
              <p className={`text-lg font-bold ${auction.status === 'inactive' || !auction.is_live ? 'text-gray-500' : 'text-white'}`}>
                {formatCurrency(customIncrement)}
              </p>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleIncrementIncrease}
              disabled={auction.status === 'inactive' || !auction.is_live || currentLot.status === 'finished'}
              className="h-8 w-8 p-0 border-gray-600 hover:border-gray-500 disabled:opacity-30"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-center mt-3">
            <p className="text-sm text-gray-400">
              Próximo lance: <span className="text-white font-medium">{formatCurrency(nextBidValue)}</span>
            </p>
          </div>
        </div>

        {/* Status e Ações do Usuário */}
        <div className="bg-gray-800/30 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2 text-center justify-center">
            <stateInfo.icon size={20} className="text-green-400" />
            <h4 className="text-lg font-semibold text-white">{stateInfo.title}</h4>
          </div>
          
          <Alert variant={stateInfo.variant === 'destructive' ? 'destructive' : 'default'} className="bg-gray-900 border-green-600/30">
            <AlertDescription className="text-gray-300">
              {stateInfo.description}
            </AlertDescription>
          </Alert>

          {/* Verificar se a transmissão está encerrada ou lote finalizado */}
          {(auction.status === 'inactive' || !auction.is_live || currentLot.status === 'finished') && (
            <Alert className="bg-red-900/20 border-red-500/50">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                <div className="text-center">
                  <p className="font-bold">
                    {currentLot.status === 'finished' ? 'Lote Finalizado' : 'Transmissão Encerrada'}
                  </p>
                  <p>
                    {currentLot.status === 'finished' 
                      ? 'Este lote já foi finalizado e não aceita mais lances.'
                      : 'Não é mais possível fazer lances ou solicitar habilitação.'
                    }
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}
          

          {/* Status do lance do usuário */}
          {userPendingBid && (
            <Alert className="bg-gray-900 border-yellow-600/30">
              <Clock className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-gray-300">
                <div className="flex justify-between items-center">
                  <span>Seu lance: {formatCurrency(userPendingBid.bid_value)}</span>
                  <Badge variant="secondary" className="bg-yellow-600/20 text-yellow-400">Em análise</Badge>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Mostrar se o usuário tem lance vencedor */}
          {(() => {
            const userWinningBid = bids.find(bid => 
              bid.user_id === userId && bid.is_winner && bid.status === 'approved'
            );
            if (userWinningBid) {
              return (
                <Alert className="bg-green-900/20 border-green-500/50">
                  <Trophy className="h-4 w-4 text-green-400" />
                  <AlertDescription className="text-green-300">
                    <div className="text-center">
                      <p className="font-bold">🎉 Parabéns! Você é o vencedor!</p>
                      <p>Lance vencedor: {formatCurrency(userWinningBid.bid_value)}</p>
                    </div>
                  </AlertDescription>
                </Alert>
              );
            }
            
            // Verificar se há algum vencedor no leilão
            const anyWinner = bids.find(bid => bid.is_winner);
            if (anyWinner && anyWinner.user_id !== userId) {
              return (
                <Alert className="bg-orange-900/20 border-orange-500/50">
                  <Trophy className="h-4 w-4 text-orange-400" />
                  <AlertDescription className="text-orange-300">
                    <div className="text-center">
                      <p className="font-bold">Leilão Finalizado</p>
                      <p>Lance vencedor: {formatCurrency(anyWinner.bid_value)}</p>
                    </div>
                  </AlertDescription>
                </Alert>
              );
            }
          })()}
        </div>

        {/* Botão Principal - Lance ou Habilitação */}
        <Button
          onClick={canBid ? onBidClick : (stateInfo.onClick || onRequestRegistration)}
          disabled={stateInfo.disabled || submittingBid || auction.status === 'inactive' || !auction.is_live || currentLot.status === 'finished'}
          className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold text-lg disabled:opacity-50"
          variant={stateInfo.variant === 'destructive' ? 'outline' : 'default'}
        >
          {submittingBid ? (
            'Enviando lance...'
          ) : canBid ? (
            <>
              <Gavel className="h-5 w-5 mr-2" />
              {`Fazer Lance - ${formatCurrency(nextBidValue)}`}
            </>
          ) : (
            stateInfo.action || 'Indisponível'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CurrentLotDisplay;