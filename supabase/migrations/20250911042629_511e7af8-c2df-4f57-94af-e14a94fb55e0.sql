-- Corrigir a função de validação de lances
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

  IF _increment_mode = 'fixed' OR _increment_mode IS NULL THEN
    IF NEW.bid_value < (_current_value + _final_increment) THEN
      RAISE EXCEPTION 'O valor do lance deve ser pelo menos R$ % (valor atual + incremento)', 
        TO_CHAR((_current_value + _final_increment), 'FM999G999G990D00');
    END IF;
  ELSIF _increment_mode = 'custom' THEN
    IF _min_custom IS NULL OR _max_custom IS NULL THEN
      RAISE EXCEPTION 'Modo de incremento personalizado requer valores mínimo e máximo configurados';
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