-- Corrigir função de validação de limite de lance
-- O limite deve ser POR LANCE, não cumulativo

CREATE OR REPLACE FUNCTION public.validate_bid_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_limit RECORD;
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
  
  -- Verificar se o lance individual ultrapassa o limite
  -- Limite é POR LANCE, não cumulativo
  IF NEW.bid_value > user_limit.max_limit THEN
    RAISE EXCEPTION 'Limite de lance atingido. Limite atual: R$ %, valor do lance: R$ %', 
      user_limit.max_limit, NEW.bid_value;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;