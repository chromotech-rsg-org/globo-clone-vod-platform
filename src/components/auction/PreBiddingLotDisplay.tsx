import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AuctionItem, Auction, Bid } from '@/types/auction';
import { formatCurrency } from '@/utils/formatters';
import { Package, Plus, Minus, Trophy, Clock, ChevronDown } from "lucide-react";

interface PreBiddingLotDisplayProps {
  selectedLot: AuctionItem;
  preBiddingLots: AuctionItem[];
  auction: Auction;
  bids: Bid[];
  customIncrement: number;
  onIncrementChange: (newIncrement: number) => void;
  nextBidValue: number;
  onBidClick: () => void;
  onLotSelect: (lotId: string) => void;
  submittingBid: boolean;
  userPendingBid: Bid | null;
  userId?: string;
}

const PreBiddingLotDisplay = ({
  selectedLot,
  preBiddingLots,
  auction,
  bids,
  customIncrement,
  onIncrementChange,
  nextBidValue,
  onBidClick,
  onLotSelect,
  submittingBid,
  userPendingBid,
  userId
}: PreBiddingLotDisplayProps) => {
  const baseIncrement = Number(selectedLot.increment ?? auction.bid_increment);
  const currentBidValue = Math.max(selectedLot.current_value, ...bids.filter(bid => bid.auction_item_id === selectedLot.id && bid.status === 'approved').map(bid => bid.bid_value));
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
      <CardHeader className="text-center py-4">
        <CardTitle className="text-white flex items-center justify-center gap-2">
          {/* Seletor de lote como nome clicável */}
          {preBiddingLots.length > 1 ? (
            <Select value={selectedLot.id} onValueChange={onLotSelect}>
              <SelectTrigger className="w-auto bg-transparent border-none text-white text-lg font-semibold hover:bg-gray-800/50 p-2">
                <div className="flex items-center gap-2">
                  <span>{selectedLot.name}</span>
                  <ChevronDown className="h-4 w-4" />
                </div>
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
          ) : (
            <span>{selectedLot.name}</span>
          )}
          
          <Badge className="bg-blue-600 text-white animate-pulse">
            PRÉ LANCE
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
        {/* Valores do Lote */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-400 mb-1">Valor Inicial</p>
            <p className="text-lg font-bold text-white break-words">
              {formatCurrency(selectedLot.initial_value)}
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

        {/* Alerta de Pré-Lance */}
        <Alert className="bg-blue-900/20 border-blue-500/50">
          <Package className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-300">
            <div className="text-center">
              <p className="font-bold">Modo Pré-Lance Ativo</p>
              <p>Você pode fazer lances antecipados neste lote.</p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Status do lance do usuário */}
        {userPendingBid && userPendingBid.auction_item_id === selectedLot.id && (
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

        {/* Mostrar se o usuário tem lance vencedor neste lote */}
        {(() => {
          const userWinningBid = bids.find(bid => 
            bid.user_id === userId && 
            bid.is_winner && 
            bid.status === 'approved' && 
            bid.auction_item_id === selectedLot.id
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
        })()}

        {/* Botão de Lance */}
        <Button 
          onClick={onBidClick}
          disabled={submittingBid}
          className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold text-lg disabled:opacity-50"
        >
          {submittingBid ? 'Enviando lance...' : (
            <>
              <Package className="h-5 w-5 mr-2" />
              {`Fazer Pré-Lance - ${formatCurrency(nextBidValue)}`}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PreBiddingLotDisplay;