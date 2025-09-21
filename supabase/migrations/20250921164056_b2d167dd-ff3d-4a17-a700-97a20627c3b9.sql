-- Remove the automatic bid approval trigger
DROP TRIGGER IF EXISTS auto_approve_bid_trigger ON public.bids;

-- Update validate_bid_value function to use correct logic
CREATE OR REPLACE FUNCTION public.validate_bid_value()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _increment_mode text;
  _auction_increment numeric;
  _lot_increment numeric;
  _min_custom numeric;
  _max_custom numeric;
  _current_value numeric;
  _final_increment numeric;
  _highest_approved_bid numeric := 0;
BEGIN
  -- Get auction data
  SELECT a.increment_mode, a.bid_increment, a.min_custom_bid, a.max_custom_bid
    INTO _increment_mode, _auction_increment, _min_custom, _max_custom
  FROM auctions a
  WHERE a.id = NEW.auction_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auction not found for bid validation';
  END IF;

  -- Get lot data
  SELECT ai.current_value, ai.increment
    INTO _current_value, _lot_increment
  FROM auction_items ai
  WHERE ai.id = NEW.auction_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auction item not found for bid validation';
  END IF;

  -- Get highest APPROVED bid for this lot
  SELECT COALESCE(MAX(bid_value), 0)
    INTO _highest_approved_bid
  FROM bids
  WHERE auction_item_id = NEW.auction_item_id 
    AND status = 'approved';

  -- Use the greatest value between current_value and highest approved bid
  _current_value := GREATEST(_current_value, _highest_approved_bid);

  -- Determine final increment (prefer lot increment, then auction increment)
  _final_increment := COALESCE(_lot_increment, _auction_increment, 100);

  -- Validate according to increment mode
  IF _increment_mode = 'fixed' OR _increment_mode IS NULL THEN
    IF NEW.bid_value < (_current_value + _final_increment) THEN
      RAISE EXCEPTION 'O valor do lance deve ser pelo menos R$ % (valor atual + incremento)', 
        TO_CHAR((_current_value + _final_increment), 'FM999G999G990D00');
    END IF;
  ELSIF _increment_mode = 'custom' THEN
    IF _min_custom IS NULL OR _max_custom IS NULL THEN
      RAISE EXCEPTION 'Modo de incremento personalizado requer valores mínimo e máximo configurados';
    END IF;
    IF NEW.bid_value < _current_value + _final_increment THEN
      RAISE EXCEPTION 'O valor do lance deve ser pelo menos R$ % (valor atual + incremento mínimo)', 
        TO_CHAR((_current_value + _final_increment), 'FM999G999G990D00');
    END IF;
    IF NEW.bid_value < _min_custom OR NEW.bid_value > _max_custom THEN
      RAISE EXCEPTION 'O valor do lance deve estar entre R$ % e R$ %', 
        TO_CHAR(_min_custom, 'FM999G999G990D00'), 
        TO_CHAR(_max_custom, 'FM999G999G990D00');
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Create trigger to update lot value only when bid is approved
CREATE OR REPLACE FUNCTION public.update_lot_value_on_bid_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only update when status changes to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    UPDATE auction_items
    SET current_value = NEW.bid_value,
        updated_at = now()
    WHERE id = NEW.auction_item_id
      AND NEW.bid_value > current_value;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create the trigger for updating lot value on approval
CREATE TRIGGER update_lot_value_on_bid_approval_trigger
  AFTER UPDATE OF status ON public.bids
  FOR EACH ROW
  EXECUTE FUNCTION public.update_lot_value_on_bid_approval();

-- Change default status of bids to 'pending'
ALTER TABLE public.bids ALTER COLUMN status SET DEFAULT 'pending';

-- Add unique constraint on auction_item_id and bid_value to prevent duplicate bid values
ALTER TABLE public.bids ADD CONSTRAINT unique_auction_item_bid_value 
  UNIQUE (auction_item_id, bid_value);