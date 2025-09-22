-- Update function to include auction_id in the return payload
CREATE OR REPLACE FUNCTION public.set_bid_winner_and_finalize_lot(p_bid_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  _is_admin boolean;
  _auction_id uuid;
  _auction_item_id uuid;
  _current_order int;
  _next_item_id uuid;
  _next_item_name text;
  _result jsonb;
BEGIN
  _is_admin := public.get_current_user_role() IN ('admin', 'desenvolvedor');
  IF NOT _is_admin THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  -- Get bid context
  SELECT auction_id, auction_item_id
    INTO _auction_id, _auction_item_id
    FROM public.bids
   WHERE id = p_bid_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bid not found';
  END IF;

  -- Mark the winning bid
  UPDATE public.bids
     SET is_winner = true,
         status = 'approved',
         updated_at = now(),
         approved_by = auth.uid()
   WHERE id = p_bid_id;

  -- Mark other bids for the same item as not winners
  UPDATE public.bids
     SET is_winner = false,
         updated_at = now()
   WHERE auction_item_id = _auction_item_id
     AND id <> p_bid_id;

  -- Finalize current lot
  UPDATE public.auction_items
     SET status = 'finished',
         is_current = false,
         updated_at = now()
   WHERE id = _auction_item_id;

  -- Get current lot order and find next available lot
  SELECT order_index INTO _current_order
    FROM public.auction_items
   WHERE id = _auction_item_id;

  -- Find next lot in sequence
  SELECT id, name INTO _next_item_id, _next_item_name
    FROM public.auction_items
   WHERE auction_id = _auction_id 
     AND order_index > _current_order
     AND status = 'not_started'
   ORDER BY order_index ASC
   LIMIT 1;

  -- Build result including auction_id
  _result := jsonb_build_object(
    'success', true,
    'auction_id', _auction_id,
    'current_lot_finalized', true,
    'next_lot_available', _next_item_id IS NOT NULL,
    'next_lot_id', _next_item_id,
    'next_lot_name', _next_item_name
  );

  RETURN _result;
END;
$function$;