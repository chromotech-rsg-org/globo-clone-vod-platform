import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AuctionItem, Auction, Bid } from '@/types/auction';
import { formatCurrency } from '@/utils/formatters';
import { Crown, Plus, Minus, Gavel } from 'lucide-react';

interface CurrentLotDisplayProps {
  currentLot: AuctionItem;
  auction: Auction;
  bids: Bid[];
  customIncrement: number;
  onIncrementChange: (newIncrement: number) => void;
  nextBidValue: number;
  onBidClick: () => void;
  canBid: boolean;
}

const CurrentLotDisplay = ({ 
  currentLot, 
  auction, 
  bids, 
  customIncrement,
  onIncrementChange,
  nextBidValue,
  onBidClick,
  canBid 
}: CurrentLotDisplayProps) => {
  const baseIncrement = Number(currentLot.increment ?? auction.bid_increment);
  const currentBidValue = Math.max(
    currentLot.current_value,
    ...bids.filter(bid => bid.auction_item_id === currentLot.id && bid.status === 'approved')
           .map(bid => bid.bid_value)
  );
  
  const minIncrement = baseIncrement;
  const maxIncrement = baseIncrement * 10; // Limite máximo de 10x o incremento base

  const handleIncrementDecrease = () => {
    const newIncrement = Math.max(minIncrement, customIncrement - baseIncrement);
    onIncrementChange(newIncrement);
  };

  const handleIncrementIncrease = () => {
    const newIncrement = Math.min(maxIncrement, customIncrement + baseIncrement);
    onIncrementChange(newIncrement);
  };

  return (
    <Card className="bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-500/50 shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-white flex items-center justify-center gap-2">
          <Crown className="h-6 w-6 text-yellow-400" />
          <span>Lote em Destaque</span>
          <Badge className="bg-green-600 text-white animate-pulse">
            EM ANDAMENTO
          </Badge>
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
            <p className="text-gray-300 leading-relaxed">{currentLot.description}</p>
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
        <div className="bg-gray-800/30 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-3 text-center">Incremento de Lance</p>
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleIncrementDecrease}
              disabled={customIncrement <= minIncrement}
              className="h-8 w-8 p-0 border-gray-600 hover:border-gray-500"
            >
              <Minus className="h-4 w-4" />
            </Button>
            
            <div className="bg-gray-900 rounded-lg px-4 py-2 min-w-[120px] text-center">
              <p className="text-sm text-gray-400">Incremento</p>
              <p className="text-lg font-bold text-white">
                {formatCurrency(customIncrement)}
              </p>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleIncrementIncrease}
              disabled={customIncrement >= maxIncrement}
              className="h-8 w-8 p-0 border-gray-600 hover:border-gray-500"
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

        {/* Botão de Lance */}
        <Button
          onClick={onBidClick}
          disabled={!canBid}
          className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold text-lg disabled:opacity-50"
        >
          <Gavel className="h-5 w-5 mr-2" />
          {canBid ? `Fazer Lance - ${formatCurrency(nextBidValue)}` : 'Lance Indisponível'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CurrentLotDisplay;