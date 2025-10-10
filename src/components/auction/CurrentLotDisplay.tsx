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
  hasOpenLots: boolean;
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
  onRequestRegistration,
  hasOpenLots
}: CurrentLotDisplayProps) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const baseIncrement = Number(currentLot.increment ?? auction.bid_increment);
  const currentBidValue = Math.max(currentLot.current_value, ...bids.filter(bid => bid.auction_item_id === currentLot.id && bid.status === 'approved').map(bid => bid.bid_value));
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
    <Card className="bg-black border-green-500/50 shadow-xl h-full flex flex-col">
      <CardHeader className="text-center py-4 px-4">
        <CardTitle className="text-white flex items-center justify-center gap-2 text-lg">
          <span className="break-words text-center max-w-full">{currentLot.name}</span>
          {(() => {
            // Só mostrar badge se o lote está em andamento
            if (currentLot.status === 'in_progress') {
              return <Badge className="bg-green-600 text-white animate-pulse">
                EM ANDAMENTO
              </Badge>;
            }
            
            // Se o lote terminou mas ainda há lotes em aberto, não mostrar badge de encerrado
            if (currentLot.status === 'finished' && hasOpenLots) {
              return null;
            }
            
            // Só mostrar encerrado se NÃO houver mais lotes em aberto
            if (!hasOpenLots && !auction.is_live) {
              return <Badge className="bg-blue-600 text-white">
                ENCERRADO
              </Badge>;
            }
            
            return null;
          })()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col justify-between px-4 py-4">
        {/* Valores do Lote */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-400 mb-1">Valor Inicial</p>
            <p className="text-lg font-bold text-white break-words">
              {formatCurrency(currentLot.initial_value)}
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-400 mb-1">Lance Atual</p>
            <p className="text-xl font-bold text-green-400 break-words">
              {formatCurrency(currentBidValue)}
            </p>
          </div>
        </div>

        {/* Controles de Incremento */}
        <div className={`rounded-lg p-4 ${(auction.status === 'inactive' && !auction.allow_pre_bidding) || (!auction.is_live && !auction.allow_pre_bidding) ? 'bg-gray-900/50' : 'bg-gray-800/30'}`}>
          <p className={`text-sm mb-3 text-center ${(auction.status === 'inactive' && !auction.allow_pre_bidding) || (!auction.is_live && !auction.allow_pre_bidding) ? 'text-gray-500' : 'text-gray-400'}`}>Incremento de Lance</p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="sm" onClick={handleIncrementDecrease} disabled={customIncrement <= minIncrement || (auction.status === 'inactive' && !auction.allow_pre_bidding) || (!auction.is_live && !auction.allow_pre_bidding) || currentLot.status === 'finished'} className="h-8 w-8 p-0 border-gray-600 hover:border-gray-500 disabled:opacity-30">
              <Minus className="h-4 w-4" />
            </Button>
            
            <div className={`rounded-lg px-4 py-2 min-w-[120px] text-center ${(auction.status === 'inactive' && !auction.allow_pre_bidding) || (!auction.is_live && !auction.allow_pre_bidding) ? 'bg-gray-900/80' : 'bg-gray-900'}`}>
              <p className={`text-sm ${(auction.status === 'inactive' && !auction.allow_pre_bidding) || (!auction.is_live && !auction.allow_pre_bidding) ? 'text-gray-500' : 'text-gray-400'}`}>Incremento</p>
              <p className={`text-lg font-bold break-words ${(auction.status === 'inactive' && !auction.allow_pre_bidding) || (!auction.is_live && !auction.allow_pre_bidding) ? 'text-gray-500' : 'text-white'}`}>
                {formatCurrency(customIncrement)}
              </p>
            </div>
            
            <Button variant="outline" size="sm" onClick={handleIncrementIncrease} disabled={(auction.status === 'inactive' && !auction.allow_pre_bidding) || (!auction.is_live && !auction.allow_pre_bidding) || currentLot.status === 'finished'} className="h-8 w-8 p-0 border-gray-600 hover:border-gray-500 disabled:opacity-30">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-center mt-3">
            <p className="text-sm text-gray-400">
              Próximo: <span className="text-white font-medium">{formatCurrency(nextBidValue)}</span>
            </p>
          </div>
        </div>

        {/* Status e Ações do Usuário */}
        <div className="bg-gray-800/30 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2 text-center justify-center">
            <PlayCircle size={20} className="text-green-400 flex-shrink-0" />
            <h4 className="text-lg font-semibold text-white break-words">
              {currentLot.status === 'in_progress' ? 'Em Andamento' : stateInfo.title}
            </h4>
          </div>
          
          <Alert variant={stateInfo.variant === 'destructive' ? 'destructive' : 'default'} className="bg-gray-900 border-green-600/30">
            <AlertDescription className="text-sm text-gray-300 break-words">
              {currentLot.status === 'in_progress' 
                ? 'Este lote está recebendo lances. Faça sua oferta agora!' 
                : stateInfo.description}
            </AlertDescription>
          </Alert>

          {/* Verificar se não há mais lotes em aberto - todos lotes finalizados */}
          {!hasOpenLots && ((auction.status === 'inactive' && !auction.allow_pre_bidding) || (!auction.is_live && !auction.allow_pre_bidding)) && <Alert className="bg-blue-900/20 border-blue-500/50">
              <AlertCircle className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-300">
                <div className="text-center">
                  <p className="font-bold">Todos os Lotes Encerrados</p>
                  <p>Este leilão não possui mais lotes disponíveis.</p>
                </div>
              </AlertDescription>
            </Alert>}
          
          {/* Lote atual aguardando mas ainda há lotes em andamento */}
          {currentLot.status === 'finished' && hasOpenLots && <Alert className="bg-yellow-900/20 border-yellow-500/50">
              <Clock className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-yellow-300">
                <div className="text-center">
                  <p className="font-bold">Aguardando Próximo Lote</p>
                  <p>A transmissão continua. Em breve será iniciado o próximo lote.</p>
                </div>
              </AlertDescription>
            </Alert>}
          

          {/* Status do lance do usuário */}
          {userPendingBid && <Alert className="bg-yellow-900/20 border-yellow-500/50">
              <Clock className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-yellow-300">
                <div className="text-center space-y-1">
                  <p className="font-bold">Lance Pendente de Aprovação</p>
                  <p>Valor do lance: {formatCurrency(userPendingBid.bid_value)}</p>
                  <p className="text-sm">Aguardando análise do leiloeiro</p>
                </div>
              </AlertDescription>
            </Alert>}
        </div>

        {/* Botão Principal - Lance ou Habilitação - Habilitado quando lote está em andamento */}
        {(hasOpenLots || currentLot.status === 'in_progress') && (
          <Button 
            onClick={canBid ? onBidClick : stateInfo.onClick || onRequestRegistration} 
            disabled={(currentLot.status === 'finished' || submittingBid || userState === 'registration_pending') && currentLot.status !== 'in_progress'} 
            className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold text-lg disabled:opacity-50" 
            variant={stateInfo.variant === 'destructive' ? 'outline' : 'default'}
          >
            {currentLot.status === 'finished' ? (
              <span>Aguardando próximo lote</span>
            ) : submittingBid ? (
              <span>Enviando lance...</span>
            ) : canBid ? (
              <div className="flex items-center justify-center gap-2 w-full">
                <Gavel className="h-5 w-5 flex-shrink-0" />
                <span className="break-words">{`Lance - ${formatCurrency(nextBidValue)}`}</span>
              </div>
            ) : (
              <span>{stateInfo.action || (userState === 'registration_pending' ? 'Habilitação em análise' : 'Indisponível')}</span>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
export default CurrentLotDisplay;