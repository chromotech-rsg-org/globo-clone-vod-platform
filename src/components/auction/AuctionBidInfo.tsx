
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/formatters';
import { Auction, Bid } from '@/types/auction';

interface AuctionBidInfoProps {
  auction: Auction;
  bids: Bid[];
  nextBidValue: number;
}

const AuctionBidInfo = ({ auction, bids, nextBidValue }: AuctionBidInfoProps) => {
  const getCurrentBidValue = () => {
    const approvedBids = bids.filter(bid => bid.status === 'approved');
    if (approvedBids.length > 0) {
      const highestBid = Math.max(...approvedBids.map(bid => bid.bid_value));
      return Math.max(highestBid, auction.current_bid_value);
    }
    return auction.current_bid_value;
  };

  const getNextBidLabel = () => {
    const hasWinner = bids.some(bid => bid.is_winner);
    return hasWinner ? 'Valor Arrematado' : 'Próximo Lance';
  };

  const getNextBidValue = () => {
    const hasWinner = bids.some(bid => bid.is_winner);
    if (hasWinner) {
      const winningBid = bids.find(bid => bid.is_winner);
      return winningBid?.bid_value || auction.current_bid_value;
    }
    return nextBidValue;
  };

  const hasWinner = bids.some(bid => bid.is_winner);

  return (
    <Card className={`bg-black border-green-600/30 ${hasWinner ? 'border-yellow-500/50 bg-yellow-900/20' : ''}`}>
      <CardHeader>
        <CardTitle className="text-lg text-white flex items-center gap-2">
          Informações do Lance
          {hasWinner && (
            <Badge className="bg-yellow-500 text-black">
              FINALIZADO
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasWinner && (
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 mb-4">
            <p className="text-yellow-400 text-center font-bold">
              🏆 Lote Arrematado! 🏆
            </p>
            <p className="text-white text-center text-sm mt-1">
              Parabéns ao arrematante!
            </p>
          </div>
        )}
        <div>
          <p className="text-sm text-gray-400 uppercase tracking-wide">
            Lance Atual
          </p>
          <p className="text-2xl font-bold text-green-400">
            {formatCurrency(getCurrentBidValue())}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-400 uppercase tracking-wide">
            {getNextBidLabel()}
          </p>
          <p className={`text-xl font-semibold ${hasWinner ? 'text-yellow-400' : 'text-white'}`}>
            {formatCurrency(getNextBidValue())}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuctionBidInfo;
