
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/utils/formatters';
import { Auction, Bid, BidUserState, AuctionItem } from '@/types/auction';
import { Play, Square, User, AlertCircle, CheckCircle, Clock, Trophy, Package, Plus, Minus, Gavel } from 'lucide-react';

interface AuctionUserActionsProps {
  auction: Auction;
  bids: Bid[];
  userState: BidUserState;
  stateInfo: any;
  submittingBid: boolean;
  userPendingBid: Bid | null;
  userId?: string;
  preBiddingLots?: AuctionItem[];
  selectedLotId?: string;
  customIncrement?: number;
  nextBidValue?: number;
  onBidClick: (lotId?: string) => void;
  onRequestRegistration: () => void;
  onLotSelect?: (lotId: string) => void;
  onIncrementChange?: (newIncrement: number) => void;
}

const AuctionUserActions = ({ 
  auction, 
  bids, 
  userState, 
  stateInfo, 
  submittingBid, 
  userPendingBid, 
  userId,
  preBiddingLots = [],
  selectedLotId,
  customIncrement = 0,
  nextBidValue = 0,
  onBidClick,
  onRequestRegistration,
  onLotSelect,
  onIncrementChange
}: AuctionUserActionsProps) => {
  const [localSelectedLotId, setLocalSelectedLotId] = useState(selectedLotId || preBiddingLots[0]?.id);

  // Sincronizar estado local com props quando muda
  useEffect(() => {
    if (selectedLotId) {
      setLocalSelectedLotId(selectedLotId);
    } else if (preBiddingLots.length > 0 && !localSelectedLotId) {
      setLocalSelectedLotId(preBiddingLots[0].id);
    }
  }, [selectedLotId, preBiddingLots, localSelectedLotId]);
  // Verificar se a transmissão está encerrada
  const isTransmissionEnded = auction.status === 'inactive' || !auction.is_live;
  
  // Verificar se está em modo pré-lance (allow_pre_bidding ativo OU lotes com status 'pre_bidding')
  const hasActivePreBidding = preBiddingLots.length > 0 && (auction.allow_pre_bidding || preBiddingLots.some(lot => lot.status === 'pre_bidding'));
  const isPreBiddingMode = hasActivePreBidding;
  const hasMultiplePreBiddingLots = preBiddingLots.length > 1;
  
  // Se está em modo pré-lance, permitir ações (incluindo habilitação) mesmo se transmissão estiver "encerrada"
  const shouldAllowBidding = isPreBiddingMode || !isTransmissionEnded;
  
  // PRIORIZAR HABILITAÇÃO: Se precisa de registro, não mostrar controles de lance
  const shouldShowBiddingControls = shouldAllowBidding && userState !== 'need_registration';
  
  // Lote selecionado
  const selectedLot = preBiddingLots.find(lot => lot.id === localSelectedLotId);
  const baseIncrement = Number(selectedLot?.increment ?? auction.bid_increment);
  const minIncrement = baseIncrement;
  
  const handleIncrementDecrease = () => {
    if (onIncrementChange && customIncrement > minIncrement) {
      const newIncrement = Math.max(minIncrement, customIncrement - baseIncrement);
      onIncrementChange(newIncrement);
    }
  };
  
  const handleIncrementIncrease = () => {
    if (onIncrementChange) {
      const newIncrement = customIncrement + baseIncrement;
      onIncrementChange(newIncrement);
    }
  };
  
  const handleLotChange = (lotId: string) => {
    setLocalSelectedLotId(lotId);
    if (onLotSelect) {
      onLotSelect(lotId);
    }
  };
  
  const handleBidClick = () => {
    if (isPreBiddingMode && localSelectedLotId) {
      onBidClick(localSelectedLotId);
    } else {
      onBidClick();
    }
  };

  return (
    <Card className="bg-black border-green-600/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <stateInfo.icon size={20} />
          {stateInfo.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant={stateInfo.variant === 'destructive' ? 'destructive' : 'default'} className="bg-gray-900 border-green-600/30">
          <AlertDescription className="text-gray-300">
            {stateInfo.description}
          </AlertDescription>
        </Alert>

        {/* Seletor de lotes em pré-lance */}
        {isPreBiddingMode && hasMultiplePreBiddingLots && userState === 'can_bid' && (
          <div className="space-y-2">
            <Alert className="bg-blue-900/20 border-blue-500/50">
              <Package className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-300">
                <p className="font-bold mb-2">Modo Pré-Lance Ativo</p>
                <p className="mb-3">Selecione o lote para fazer seu lance:</p>
                <Select value={localSelectedLotId} onValueChange={handleLotChange}>
                  <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Selecione um lote" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {preBiddingLots.map((lot) => (
                      <SelectItem key={lot.id} value={lot.id} className="text-white hover:bg-gray-700">
                        <div className="flex flex-col">
                          <span className="font-medium">{lot.name}</span>
                          <span className="text-sm text-gray-400">
                            Valor atual: {formatCurrency(lot.current_value)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Alerta de lote único em pré-lance */}
        {isPreBiddingMode && !hasMultiplePreBiddingLots && userState === 'can_bid' && (
          <Alert className="bg-blue-900/20 border-blue-500/50">
            <Package className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-300">
              <p className="font-bold">Modo Pré-Lance Ativo</p>
              <p>Lote disponível: <span className="font-medium">{preBiddingLots[0]?.name}</span></p>
              <p>Valor atual: {formatCurrency(preBiddingLots[0]?.current_value || 0)}</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Controles de Incremento para Pré-Lance */}
        {isPreBiddingMode && userState === 'can_bid' && onIncrementChange && (
          <div className="bg-gray-800/30 rounded-lg p-4">
            <p className="text-sm mb-3 text-center text-gray-400">Incremento de Lance</p>
            <div className="flex items-center justify-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleIncrementDecrease} 
                disabled={customIncrement <= minIncrement} 
                className="h-8 w-8 p-0 border-gray-600 hover:border-gray-500 disabled:opacity-30"
              >
                <Minus className="h-4 w-4" />
              </Button>
              
              <div className="rounded-lg px-4 py-2 min-w-[120px] text-center bg-gray-900">
                <p className="text-sm text-gray-400">Incremento</p>
                <p className="text-lg font-bold text-white break-words">
                  {formatCurrency(customIncrement)}
                </p>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleIncrementIncrease} 
                className="h-8 w-8 p-0 border-gray-600 hover:border-gray-500"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="text-center mt-3">
              <p className="text-sm text-gray-400">
                Próximo: <span className="text-white font-medium">{formatCurrency(nextBidValue)}</span>
              </p>
            </div>
          </div>
        )}

        {/* Mostrar alerta de status da transmissão */}
        {isTransmissionEnded && !isPreBiddingMode && (
          <Alert className="bg-red-900/20 border-red-500/50">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300">
              <div className="text-center">
                <p className="font-bold">Transmissão Encerrada</p>
                <p>Não é mais possível fazer lances ou solicitar habilitação.</p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Mostrar alerta de pré-lance ativo quando transmissão está encerrada mas há pré-lances */}
        {isTransmissionEnded && isPreBiddingMode && (
          <Alert className="bg-blue-900/20 border-blue-500/50">
            <Package className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-300">
              <div className="text-center">
                <p className="font-bold">Pré-Lance Ativo</p>
                <p>Você pode fazer lances nos lotes disponíveis para pré-lance.</p>
              </div>
            </AlertDescription>
          </Alert>
        )}
         
      {/* Botão Principal - SEMPRE mostrar em pré-lance, priorizando habilitação */}
      {(shouldAllowBidding || isPreBiddingMode) && (
        <Button 
          onClick={
            userState === 'need_registration' 
              ? onRequestRegistration 
              : userState === 'can_bid' 
              ? handleBidClick 
              : stateInfo.onClick
          }
          disabled={
            submittingBid || 
            userState === 'registration_pending' ||
            (userState !== 'need_registration' && !shouldAllowBidding) ||
            (isPreBiddingMode && hasMultiplePreBiddingLots && !localSelectedLotId)
          }
          className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-bold text-lg disabled:opacity-50"
        >
          {submittingBid ? (
            <span>Enviando lance...</span>
          ) : userState === 'need_registration' ? (
            <span>Habilite-se</span>
          ) : userState === 'registration_pending' ? (
            <span>Habilitação em Análise</span>
          ) : userState === 'can_bid' ? (
            <div className="flex items-center justify-center gap-2">
              <Gavel className="h-5 w-5" />
              <span>
                {isPreBiddingMode 
                  ? `Fazer Pré-Lance - ${formatCurrency(nextBidValue)}`
                  : `Lance - ${formatCurrency(nextBidValue)}`
                }
              </span>
            </div>
          ) : (
            <span>Aguardando...</span>
          )}
        </Button>
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
      </CardContent>
    </Card>
  );
};

export default AuctionUserActions;
