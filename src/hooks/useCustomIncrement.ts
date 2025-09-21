import { useState, useEffect } from 'react';
import { AuctionItem, Auction } from '@/types/auction';

export const useCustomIncrement = (currentLot: AuctionItem | null, auction: Auction | null) => {
  const [customIncrement, setCustomIncrement] = useState<number>(0);

  useEffect(() => {
    if (currentLot && auction) {
      const baseIncrement = Number(currentLot.increment ?? auction.bid_increment ?? 100);
      
      // Garantir que o incremento esteja dentro de limites razoáveis
      const clampedIncrement = Math.max(1, Math.min(baseIncrement, 1000000));
      
      console.log('🔧 useCustomIncrement update:', {
        currentLot: { id: currentLot.id, name: currentLot.name, increment: currentLot.increment },
        auctionIncrement: auction.bid_increment,
        baseIncrement,
        clampedIncrement
      });
      
      setCustomIncrement(clampedIncrement);
    } else if (auction) {
      // Fallback para quando não há lote atual
      const fallbackIncrement = Number(auction.bid_increment ?? 100);
      setCustomIncrement(Math.max(1, Math.min(fallbackIncrement, 1000000)));
    }
  }, [currentLot, auction]);

  const updateCustomIncrement = (newIncrement: number) => {
    // Validar novo incremento
    const validIncrement = Math.max(1, Math.min(newIncrement, 1000000));
    console.log('🎯 Manual increment update:', { requested: newIncrement, validated: validIncrement });
    setCustomIncrement(validIncrement);
  };

  return {
    customIncrement,
    updateCustomIncrement
  };
};