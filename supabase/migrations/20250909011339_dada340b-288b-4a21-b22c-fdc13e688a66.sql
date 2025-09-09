-- Update validate_bid_value function to use lot-specific increment with proper search_path
CREATE OR REPLACE FUNCTION public.validate_bid_value()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _increment_mode text;
  _bid_increment numeric;
  _lot_increment numeric;
  _min_custom numeric;
  _max_custom numeric;
  _current_value numeric;
  _final_increment numeric;
BEGIN
  SELECT a.increment_mode, a.bid_increment, a.min_custom_bid, a.max_custom_bid
    INTO _increment_mode, _bid_increment, _min_custom, _max_custom
  FROM auctions a
  WHERE a.id = NEW.auction_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auction not found for bid validation';
  END IF;

  SELECT ai.current_value, ai.increment
    INTO _current_value, _lot_increment
  FROM auction_items ai
  WHERE ai.id = NEW.auction_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auction item not found for bid validation';
  END IF;

  -- Use lot increment if available, otherwise auction increment
  _final_increment := COALESCE(_lot_increment, _bid_increment);

  IF _increment_mode = 'fixed' THEN
    IF NEW.bid_value < (_current_value + _final_increment) THEN
      RAISE EXCEPTION 'Bid value (%.2f) must be at least current value (%.2f) + increment (%.2f)',
        NEW.bid_value, _current_value, _final_increment;
    END IF;
  ELSIF _increment_mode = 'custom' THEN
    IF _min_custom IS NULL OR _max_custom IS NULL THEN
      RAISE EXCEPTION 'Custom increment mode requires min and max bid to be configured';
    END IF;
    IF NEW.bid_value < _min_custom OR NEW.bid_value > _max_custom THEN
      RAISE EXCEPTION 'Bid value must be between % and %', _min_custom, _max_custom;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Create function to auto-approve bids and update lot value with proper search_path
CREATE OR REPLACE FUNCTION public.auto_approve_bid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Set bid as approved automatically
  NEW.status := 'approved';
  NEW.approved_by := NEW.user_id;
  
  -- Update auction item current value
  UPDATE auction_items
  SET current_value = NEW.bid_value,
      updated_at = now()
  WHERE id = NEW.auction_item_id
    AND NEW.bid_value > current_value;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for auto-approving bids
DROP TRIGGER IF EXISTS auto_approve_bid_trigger ON public.bids;
CREATE TRIGGER auto_approve_bid_trigger
  BEFORE INSERT ON public.bids
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_approve_bid();

-- Update RLS policy for bids to require approved registration
DROP POLICY IF EXISTS "Users can create own bids" ON public.bids;
CREATE POLICY "Users can create own bids" 
ON public.bids 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) 
  AND (auth.uid() IS NOT NULL)
  AND EXISTS (
    SELECT 1 FROM auction_registrations ar
    WHERE ar.user_id = auth.uid() 
      AND ar.auction_id = bids.auction_id 
      AND ar.status = 'approved'
  )
);