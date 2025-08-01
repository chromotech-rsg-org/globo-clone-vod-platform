-- Corrigir funções com search_path para segurança
CREATE OR REPLACE FUNCTION public.user_has_active_subscription(user_uuid uuid)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
STABLE
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.subscriptions 
    WHERE user_id = user_uuid 
    AND status = 'active' 
    AND (end_date IS NULL OR end_date > now())
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.user_is_registered_for_auction(user_uuid uuid, auction_uuid uuid)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
STABLE
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.auction_registrations 
    WHERE user_id = user_uuid 
    AND auction_id = auction_uuid 
    AND status = 'approved'
  );
END;
$$;