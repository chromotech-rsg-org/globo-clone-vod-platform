import { useState, useEffect } from 'react';
import { AuctionItem, Auction } from '@/types/auction';

export const useCustomIncrement = (currentLot: AuctionItem | null, auction: Auction | null) => {
  const [customIncrement, setCustomIncrement] = useState<number>(0);

  useEffect(() => {
    if (currentLot && auction) {
      const baseIncrement = Number(currentLot.increment ?? auction.bid_increment);
      setCustomIncrement(baseIncrement);
    }
  }, [currentLot, auction]);

  const updateCustomIncrement = (newIncrement: number) => {
    setCustomIncrement(newIncrement);
  };

  return {
    customIncrement,
    updateCustomIncrement
  };
};