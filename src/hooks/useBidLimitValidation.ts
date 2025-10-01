import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface BidLimitValidationResult {
  canBid: boolean;
  currentLimit: number;
  totalBidsUsed: number;
  isUnlimited: boolean;
  remainingLimit: number;
}

export const useBidLimitValidation = () => {
  const [validating, setValidating] = useState(false);

  const validateBidLimit = useCallback(async (
    userId: string,
    auctionId: string,
    bidValue: number
  ): Promise<BidLimitValidationResult> => {
    setValidating(true);
    
    try {
      // Get user's bid limit
      const { data: limitData, error: limitError } = await supabase
        .from('client_bid_limits')
        .select('max_limit, is_unlimited')
        .eq('user_id', userId)
        .single();

      if (limitError && limitError.code !== 'PGRST116') {
        throw limitError;
      }

      const currentLimit = limitData?.max_limit || 10000;
      const isUnlimited = limitData?.is_unlimited || false;

      // If unlimited, allow
      if (isUnlimited) {
        return {
          canBid: true,
          currentLimit,
          totalBidsUsed: 0,
          isUnlimited: true,
          remainingLimit: Infinity
        };
      }

      // Calculate total approved bids for this auction
      const { data: bidsData, error: bidsError } = await supabase
        .from('bids')
        .select('bid_value')
        .eq('user_id', userId)
        .eq('auction_id', auctionId)
        .eq('status', 'approved');

      if (bidsError) throw bidsError;

      const totalBidsUsed = (bidsData || []).reduce((sum, bid) => sum + Number(bid.bid_value), 0);
      const remainingLimit = currentLimit - totalBidsUsed;
      const canBid = remainingLimit >= bidValue;

      return {
        canBid,
        currentLimit,
        totalBidsUsed,
        isUnlimited: false,
        remainingLimit
      };
    } catch (error) {
      console.error('Error validating bid limit:', error);
      toast({
        title: "Erro ao validar limite",
        description: "Não foi possível verificar seu limite de lance",
        variant: "destructive"
      });
      
      // Return safe defaults
      return {
        canBid: false,
        currentLimit: 0,
        totalBidsUsed: 0,
        isUnlimited: false,
        remainingLimit: 0
      };
    } finally {
      setValidating(false);
    }
  }, []);

  const logFailedBidAttempt = useCallback(async (
    userId: string,
    auctionId: string,
    auctionItemId: string,
    attemptedBidValue: number,
    currentLimit: number,
    totalBidsAtAttempt: number
  ) => {
    try {
      const { error } = await supabase
        .from('failed_bid_attempts')
        .insert({
          user_id: userId,
          auction_id: auctionId,
          auction_item_id: auctionItemId,
          attempted_bid_value: attemptedBidValue,
          current_limit: currentLimit,
          total_bids_at_attempt: totalBidsAtAttempt,
          reason: 'limit_exceeded'
        });

      if (error) {
        console.error('Error logging failed bid attempt:', error);
      }
    } catch (error) {
      console.error('Error logging failed bid attempt:', error);
    }
  }, []);

  return {
    validateBidLimit,
    logFailedBidAttempt,
    validating
  };
};
