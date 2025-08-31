
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  return (
    <Card className="bg-black border-green-600/30">
      <CardHeader>
        <CardTitle className="text-lg text-white">Informações do Lance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
            Lance Inicial
          </p>
          <p className="text-lg font-medium text-gray-300">
            {formatCurrency(auction.initial_bid_value)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-400 uppercase tracking-wide">
            {getNextBidLabel()}
          </p>
          <p className="text-xl font-semibold text-white">
            {formatCurrency(getNextBidValue())}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuctionBidInfo;
