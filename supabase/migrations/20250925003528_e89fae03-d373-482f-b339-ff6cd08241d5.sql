-- Add the new status 'indisponivel' to auction_items status enum
-- First, let me check if there's already a check constraint or enum for status
-- Since the schema shows it's just text, we need to make sure we handle the new status properly

-- Create a function to automatically update lot statuses based on auction state
CREATE OR REPLACE FUNCTION public.update_lot_statuses_based_on_auction_state()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- When auction goes offline (is_live = false) and doesn't allow pre-bidding
  IF NEW.is_live = false AND NEW.allow_pre_bidding = false THEN
    -- Update lots that don't have winning bids to 'indisponivel'
    UPDATE auction_items 
    SET status = 'indisponivel', 
        updated_at = now()
    WHERE auction_id = NEW.id 
      AND status NOT IN ('finished')
      AND NOT EXISTS (
        SELECT 1 FROM bids 
        WHERE bids.auction_item_id = auction_items.id 
          AND bids.is_winner = true 
          AND bids.status = 'approved'
      );
    
    -- Update lots that have winning bids to 'finished'
    UPDATE auction_items 
    SET status = 'finished',
        updated_at = now()
    WHERE auction_id = NEW.id 
      AND EXISTS (
        SELECT 1 FROM bids 
        WHERE bids.auction_item_id = auction_items.id 
          AND bids.is_winner = true 
          AND bids.status = 'approved'
      );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to automatically update lot statuses when auction state changes
DROP TRIGGER IF EXISTS trigger_update_lot_statuses ON auctions;
CREATE TRIGGER trigger_update_lot_statuses
  AFTER UPDATE OF is_live, allow_pre_bidding ON auctions
  FOR EACH ROW
  EXECUTE FUNCTION update_lot_statuses_based_on_auction_state();

-- Create a function that can be called manually to update lot statuses for a specific auction
CREATE OR REPLACE FUNCTION public.update_auction_lot_statuses(auction_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  auction_record record;
BEGIN
  -- Get auction state
  SELECT is_live, allow_pre_bidding INTO auction_record
  FROM auctions 
  WHERE id = auction_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auction not found';
  END IF;
  
  -- If auction is not live and doesn't allow pre-bidding
  IF auction_record.is_live = false AND auction_record.allow_pre_bidding = false THEN
    -- Update lots without winning bids to 'indisponivel'
    UPDATE auction_items 
    SET status = 'indisponivel', 
        updated_at = now()
    WHERE auction_id = auction_uuid 
      AND status NOT IN ('finished')
      AND NOT EXISTS (
        SELECT 1 FROM bids 
        WHERE bids.auction_item_id = auction_items.id 
          AND bids.is_winner = true 
          AND bids.status = 'approved'
      );
    
    -- Update lots with winning bids to 'finished'
    UPDATE auction_items 
    SET status = 'finished',
        updated_at = now()
    WHERE auction_id = auction_uuid 
      AND EXISTS (
        SELECT 1 FROM bids 
        WHERE bids.auction_item_id = auction_items.id 
          AND bids.is_winner = true 
          AND bids.status = 'approved'
      );
  END IF;
END;
$function$;