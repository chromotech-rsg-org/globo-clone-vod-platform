import { useMemo } from 'react';
import { AuctionItem, Bid } from '@/types/auction';

export const useLotStatistics = (lots: AuctionItem[], bids: Bid[]) => {
  return useMemo(() => {
    const currentLot = lots.find(lot => lot.is_current) || lots.find(lot => lot.status === 'in_progress');
    const activeLots = lots.filter(lot => lot.status === 'in_progress' || lot.is_current);
    const preBiddingLots = lots.filter(lot => lot.status === 'pre_bidding').sort((a, b) => a.order_index - b.order_index);
    const finishedLots = lots.filter(lot => lot.status === 'finished');
    const notStartedLots = lots.filter(lot => lot.status === 'not_started');
    const nextLot = notStartedLots.sort((a, b) => a.order_index - b.order_index)[0];

    // Calcular vencedores por lote
    const lotWinners = finishedLots.map(lot => {
      const winningBid = bids.find(bid => bid.auction_item_id === lot.id && bid.is_winner);
      return {
        lotId: lot.id,
        lot,
        winningBid
      };
    });

    return {
      currentLot,
      currentLotId: currentLot?.id,
      activeLots,
      preBiddingLots,
      finishedLots,
      notStartedLots,
      nextLot,
      lotWinners,
      hasActiveLot: !!currentLot,
      hasPreBiddingLots: preBiddingLots.length > 0,
      multiplePreBiddingLots: preBiddingLots.length > 1,
      isAllFinished: lots.length > 0 && finishedLots.length === lots.length
    };
  }, [lots, bids]);
};