
-- 1) Incremento fixo/personalizado no leilão
ALTER TABLE public.auctions
  ADD COLUMN IF NOT EXISTS increment_mode text NOT NULL DEFAULT 'fixed',
  ADD COLUMN IF NOT EXISTS min_custom_bid numeric,
  ADD COLUMN IF NOT EXISTS max_custom_bid numeric;

-- 2) Garantir exclusividade do item atual por leilão
CREATE OR REPLACE FUNCTION public.enforce_single_current_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF NEW.is_current THEN
    UPDATE public.auction_items
      SET is_current = false
      WHERE auction_id = NEW.auction_id AND id <> NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_enforce_single_current_item ON public.auction_items;
CREATE TRIGGER trg_enforce_single_current_item
AFTER INSERT OR UPDATE OF is_current ON public.auction_items
FOR EACH ROW EXECUTE FUNCTION public.enforce_single_current_item();

-- 3) Validar valor do lance conforme o modo de incremento
CREATE OR REPLACE FUNCTION public.validate_bid_value()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  _increment_mode text;
  _bid_increment numeric;
  _min_custom numeric;
  _max_custom numeric;
  _current_value numeric;
BEGIN
  SELECT a.increment_mode, a.bid_increment, a.min_custom_bid, a.max_custom_bid
    INTO _increment_mode, _bid_increment, _min_custom, _max_custom
  FROM public.auctions a
  WHERE a.id = NEW.auction_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auction not found for bid validation';
  END IF;

  SELECT ai.current_value
    INTO _current_value
  FROM public.auction_items ai
  WHERE ai.id = NEW.auction_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auction item not found for bid validation';
  END IF;

  IF _increment_mode = 'fixed' THEN
    -- Regras: mínimo = valor_atual + incremento
    IF NEW.bid_value < (_current_value + _bid_increment) THEN
      RAISE EXCEPTION 'Bid value (%.2f) must be at least current value (%.2f) + increment (%.2f)',
        NEW.bid_value, _current_value, _bid_increment;
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

DROP TRIGGER IF EXISTS trg_validate_bid_value ON public.bids;
CREATE TRIGGER trg_validate_bid_value
BEFORE INSERT OR UPDATE OF bid_value ON public.bids
FOR EACH ROW EXECUTE FUNCTION public.validate_bid_value();

-- 4) Avançar automaticamente para o próximo item quando houver vencedor
CREATE OR REPLACE FUNCTION public.advance_to_next_item_on_winner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  _current_order int;
  _next_item_id uuid;
BEGIN
  IF NEW.is_winner IS TRUE AND (OLD.is_winner IS DISTINCT FROM NEW.is_winner) THEN
    SELECT order_index INTO _current_order
    FROM public.auction_items
    WHERE id = NEW.auction_item_id;

    IF FOUND THEN
      -- Desmarca o atual
      UPDATE public.auction_items SET is_current = false WHERE id = NEW.auction_item_id;

      -- Seleciona o próximo por ordem
      SELECT id INTO _next_item_id
      FROM public.auction_items
      WHERE auction_id = NEW.auction_id AND order_index > _current_order
      ORDER BY order_index ASC
      LIMIT 1;

      -- Ativa o próximo, se existir
      IF _next_item_id IS NOT NULL THEN
        UPDATE public.auction_items SET is_current = true WHERE id = _next_item_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_advance_to_next_item_on_winner ON public.bids;
CREATE TRIGGER trg_advance_to_next_item_on_winner
AFTER UPDATE OF is_winner ON public.bids
FOR EACH ROW EXECUTE FUNCTION public.advance_to_next_item_on_winner();

-- 5) Registro de aceite dos termos
CREATE TABLE IF NOT EXISTS public.terms_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  terms_version text,
  ip_address text,
  user_agent text,
  locale text,
  timezone text,
  screen_resolution text,
  referrer text,
  extra jsonb
);

ALTER TABLE public.terms_acceptances ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para aceite dos termos
CREATE POLICY "Users can view own terms acceptances"
  ON public.terms_acceptances
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own terms acceptances"
  ON public.terms_acceptances
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all terms acceptances"
  ON public.terms_acceptances
  FOR ALL
  USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'desenvolvedor'::text]));

-- 6) Realtime robusto (dados completos nos updates)
ALTER TABLE public.bids REPLICA IDENTITY FULL;
ALTER TABLE public.auction_registrations REPLICA IDENTITY FULL;
ALTER TABLE public.auction_items REPLICA IDENTITY FULL;
ALTER TABLE public.subscriptions REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname='public' AND tablename='bids') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.bids';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname='public' AND tablename='auction_registrations') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_registrations';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname='public' AND tablename='auction_items') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_items';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname='public' AND tablename='subscriptions') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions';
  END IF;
END$$;
