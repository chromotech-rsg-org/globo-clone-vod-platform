
-- 1) Adiciona coluna de plano no perfil (referência para plans.id)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES public.plans (id);

COMMENT ON COLUMN public.profiles.plan_id IS 'Plano associado ao perfil (opcional).';

-- 2) RPC: Reabrir (ou recriar) habilitação de leilão
CREATE OR REPLACE FUNCTION public.reopen_registration(p_user uuid, p_auction uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  _is_admin boolean;
  _updated integer;
BEGIN
  -- Permitir somente o próprio usuário ou admin/dev
  _is_admin := public.get_current_user_role() IN ('admin', 'desenvolvedor');
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF auth.uid() <> p_user AND NOT _is_admin THEN
    RAISE EXCEPTION 'Access denied: cannot reopen registration for another user';
  END IF;

  -- Tentar reabrir uma habilitação cancelada
  UPDATE public.auction_registrations
     SET status = 'reopened',
         updated_at = now(),
         client_notes = COALESCE(client_notes, '')
   WHERE user_id = p_user
     AND auction_id = p_auction
     AND status = 'canceled';

  GET DIAGNOSTICS _updated = ROW_COUNT;

  -- Se não havia cancelada, garantir que exista um registro pendente
  IF _updated = 0 THEN
    INSERT INTO public.auction_registrations (user_id, auction_id, status)
    VALUES (p_user, p_auction, 'pending')
    ON CONFLICT (id) DO NOTHING; -- proteção defensiva
  END IF;
END;
$function$;

-- 3) RPC: Definir lance vencedor
CREATE OR REPLACE FUNCTION public.set_bid_winner(p_bid_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  _is_admin boolean;
  _auction_id uuid;
  _auction_item_id uuid;
BEGIN
  _is_admin := public.get_current_user_role() IN ('admin', 'desenvolvedor');
  IF NOT _is_admin THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  -- Obter contexto do lance
  SELECT auction_id, auction_item_id
    INTO _auction_id, _auction_item_id
    FROM public.bids
   WHERE id = p_bid_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bid not found';
  END IF;

  -- Marcar o lance vencedor
  UPDATE public.bids
     SET is_winner = true,
         status = 'approved',
         updated_at = now(),
         approved_by = auth.uid()
   WHERE id = p_bid_id;

  -- Opcional: garantir demais lances do mesmo item como não vencedores
  UPDATE public.bids
     SET is_winner = false,
         updated_at = now()
   WHERE auction_item_id = _auction_item_id
     AND id <> p_bid_id;
END;
$function$;

-- 4) RPC: Cancelar plano/assinatura ativa do usuário atual
CREATE OR REPLACE FUNCTION public.cancel_user_plan()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  _affected int;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.subscriptions
     SET status = 'canceled',
         end_date = now(),
         updated_at = now()
   WHERE user_id = auth.uid()
     AND status = 'active';

  GET DIAGNOSTICS _affected = ROW_COUNT;
  RETURN _affected > 0;
END;
$function$;

-- Observação: as políticas existentes já restringem acesso; SECURITY DEFINER permite a execução controlada via checagens acima.
