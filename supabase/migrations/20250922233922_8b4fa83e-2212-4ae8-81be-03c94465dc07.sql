-- Fix: validation triggers should not run when updating non-price fields on bids
-- Add early return for UPDATE when bid_value didn't change

-- 1) validate_bid_value
CREATE OR REPLACE FUNCTION public.validate_bid_value()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
  -- Skip validation when it's an UPDATE and bid_value didn't change
  IF TG_OP = 'UPDATE' AND NEW.bid_value IS NOT DISTINCT FROM OLD.bid_value THEN
    RETURN NEW;
  END IF;

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
$$;

-- 2) validate_and_approve_bid
CREATE OR REPLACE FUNCTION public.validate_and_approve_bid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
  -- Skip validation when it's an UPDATE and bid_value didn't change
  IF TG_OP = 'UPDATE' AND NEW.bid_value IS NOT DISTINCT FROM OLD.bid_value THEN
    RETURN NEW;
  END IF;

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
      RAISE EXCEPTION 'O valor do lance deve ser pelo menos R$ % (valor atual + incremento). Sugestão: R$ %', 
        TO_CHAR((_current_value + _final_increment), 'FM999G999G990D00'),
        TO_CHAR((_current_value + _final_increment), 'FM999G999G990D00');
    END IF;
  ELSIF _increment_mode = 'custom' THEN
    IF _min_custom IS NULL OR _max_custom IS NULL THEN
      RAISE EXCEPTION 'Modo de incremento personalizado requer valores mínimo e máximo configurados';
    END IF;
    IF NEW.bid_value < _current_value + _final_increment THEN
      RAISE EXCEPTION 'O valor do lance deve ser pelo menos R$ % (valor atual + incremento mínimo). Sugestão: R$ %', 
        TO_CHAR((_current_value + _final_increment), 'FM999G999G990D00'),
        TO_CHAR((_current_value + _final_increment), 'FM999G999G990D00');
    END IF;
    IF NEW.bid_value < _min_custom OR NEW.bid_value > _max_custom THEN
      RAISE EXCEPTION 'O valor do lance deve estar entre R$ % e R$ %', 
        TO_CHAR(_min_custom, 'FM999G999G990D00'), 
        TO_CHAR(_max_custom, 'FM999G999G990D00');
    END IF;
  END IF;

  -- Auto-approve the bid (only makes sense on INSERT)
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'approved';
    NEW.approved_by := NEW.user_id;

    -- Update auction item current value if this bid is higher
    UPDATE auction_items
    SET current_value = NEW.bid_value,
        updated_at = now()
    WHERE id = NEW.auction_item_id
      AND NEW.bid_value > current_value;
  END IF;

  RETURN NEW;
END;
$$;