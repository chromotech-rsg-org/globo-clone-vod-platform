-- Corrigir inconsistências nos lotes e atualizar função de validação

-- Primeiro, vamos garantir que apenas um lote seja 'current' por leilão
UPDATE auction_items 
SET is_current = false 
WHERE auction_id = 'b3523a34-5880-4877-9cfe-06443c1e7741';

-- Definir o lote correto como atual (o que tem status 'in_progress')
UPDATE auction_items 
SET is_current = true, status = 'in_progress'
WHERE id = '6c5c8989-f914-4137-84f0-32bd012406bc'
  AND auction_id = 'b3523a34-5880-4877-9cfe-06443c1e7741';

-- Atualizar a função validate_bid_value para ser mais robusta
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
  -- Obter dados do leilão
  SELECT a.increment_mode, a.bid_increment, a.min_custom_bid, a.max_custom_bid
    INTO _increment_mode, _auction_increment, _min_custom, _max_custom
  FROM auctions a
  WHERE a.id = NEW.auction_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auction not found for bid validation';
  END IF;

  -- Obter dados do lote
  SELECT ai.current_value, ai.increment
    INTO _current_value, _lot_increment
  FROM auction_items ai
  WHERE ai.id = NEW.auction_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auction item not found for bid validation';
  END IF;

  -- Obter o maior lance aprovado para este lote
  SELECT COALESCE(MAX(bid_value), 0)
    INTO _highest_approved_bid
  FROM bids
  WHERE auction_item_id = NEW.auction_item_id 
    AND status = 'approved';

  -- Usar o maior valor entre current_value e o maior lance aprovado
  _current_value := GREATEST(_current_value, _highest_approved_bid);

  -- Determinar incremento final (preferir incremento do lote, senão do leilão)
  _final_increment := COALESCE(_lot_increment, _auction_increment, 100);

  -- Validar conforme modo de incremento
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