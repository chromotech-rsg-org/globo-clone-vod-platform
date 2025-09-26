-- Corrigir search_path das funções para segurança
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, new_values, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, old_values, new_values, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, old_values, user_id)
    VALUES (TG_TABLE_NAME, OLD.id, TG_OP, to_jsonb(OLD), auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.validate_bid_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_limit RECORD;
  user_total_bids NUMERIC;
BEGIN
  -- Buscar limite do usuário
  SELECT max_limit, is_unlimited INTO user_limit
  FROM public.client_bid_limits
  WHERE user_id = NEW.user_id;
  
  -- Se não tem limite configurado, usar limite padrão
  IF NOT FOUND THEN
    INSERT INTO public.client_bid_limits (user_id, max_limit, created_by)
    VALUES (NEW.user_id, 10000, NEW.user_id);
    user_limit.max_limit := 10000;
    user_limit.is_unlimited := false;
  END IF;
  
  -- Se é ilimitado, permitir
  IF user_limit.is_unlimited THEN
    RETURN NEW;
  END IF;
  
  -- Calcular total de lances aprovados do usuário no leilão
  SELECT COALESCE(SUM(bid_value), 0) INTO user_total_bids
  FROM public.bids
  WHERE user_id = NEW.user_id 
    AND auction_id = NEW.auction_id
    AND status = 'approved';
  
  -- Verificar se o novo lance ultrapassa o limite
  IF (user_total_bids + NEW.bid_value) > user_limit.max_limit THEN
    RAISE EXCEPTION 'Limite de lance atingido. Limite atual: R$ %, total com este lance: R$ %', 
      user_limit.max_limit, (user_total_bids + NEW.bid_value);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS TABLE(
  total_users BIGINT,
  total_auctions BIGINT,
  total_bids BIGINT,
  total_revenue NUMERIC,
  active_auctions BIGINT,
  pending_registrations BIGINT,
  documents_count BIGINT,
  limit_requests_pending BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF get_current_user_role() NOT IN ('admin', 'desenvolvedor') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.profiles)::BIGINT as total_users,
    (SELECT COUNT(*) FROM public.auctions)::BIGINT as total_auctions,
    (SELECT COUNT(*) FROM public.bids WHERE status = 'approved')::BIGINT as total_bids,
    (SELECT COALESCE(SUM(bid_value), 0) FROM public.bids WHERE status = 'approved' AND is_winner = true)::NUMERIC as total_revenue,
    (SELECT COUNT(*) FROM public.auctions WHERE status = 'active')::BIGINT as active_auctions,
    (SELECT COUNT(*) FROM public.auction_registrations WHERE status = 'pending')::BIGINT as pending_registrations,
    (SELECT COUNT(*) FROM public.client_documents)::BIGINT as documents_count,
    (SELECT COUNT(*) FROM public.limit_increase_requests WHERE status = 'pending')::BIGINT as limit_requests_pending;
END;
$$;