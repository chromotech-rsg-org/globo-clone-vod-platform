-- Extensão da auditoria para todas as tabelas
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sistema de documentos do cliente
CREATE TABLE public.client_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  category TEXT NOT NULL DEFAULT 'general',
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sistema de limites por cliente
CREATE TABLE public.client_bid_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  max_limit NUMERIC NOT NULL DEFAULT 10000,
  is_unlimited BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Solicitações de aumento de limite
CREATE TABLE public.limit_increase_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  current_limit NUMERIC NOT NULL,
  requested_limit NUMERIC NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Configurações do sistema
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_bid_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.limit_increase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para audit_logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
USING (get_current_user_role() = ANY(ARRAY['admin', 'desenvolvedor']));

-- Políticas RLS para client_documents
CREATE POLICY "Admins can manage all documents"
ON public.client_documents FOR ALL
USING (get_current_user_role() = ANY(ARRAY['admin', 'desenvolvedor']));

CREATE POLICY "Users can view own documents"
ON public.client_documents FOR SELECT
USING (auth.uid() = user_id);

-- Políticas RLS para client_bid_limits
CREATE POLICY "Admins can manage bid limits"
ON public.client_bid_limits FOR ALL
USING (get_current_user_role() = ANY(ARRAY['admin', 'desenvolvedor']));

CREATE POLICY "Users can view own limits"
ON public.client_bid_limits FOR SELECT
USING (auth.uid() = user_id);

-- Políticas RLS para limit_increase_requests
CREATE POLICY "Admins can manage limit requests"
ON public.limit_increase_requests FOR ALL
USING (get_current_user_role() = ANY(ARRAY['admin', 'desenvolvedor']));

CREATE POLICY "Users can create own requests"
ON public.limit_increase_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own requests"
ON public.limit_increase_requests FOR SELECT
USING (auth.uid() = user_id);

-- Políticas RLS para system_settings
CREATE POLICY "Admins can manage system settings"
ON public.system_settings FOR ALL
USING (get_current_user_role() = ANY(ARRAY['admin', 'desenvolvedor']));

-- Triggers para auditoria automática
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers para tabelas importantes
CREATE TRIGGER audit_auctions_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.auctions
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_auction_items_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.auction_items
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_bids_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.bids
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_subscriptions_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Função para validar limites de lance
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para validar limites nos lances
CREATE TRIGGER validate_bid_limit_trigger
  BEFORE INSERT ON public.bids
  FOR EACH ROW EXECUTE FUNCTION public.validate_bid_limit();

-- Bucket para documentos
INSERT INTO storage.buckets (id, name, public) VALUES ('client-documents', 'client-documents', false);

-- Políticas para o bucket de documentos
CREATE POLICY "Admins can manage all documents"
ON storage.objects FOR ALL
USING (bucket_id = 'client-documents' AND get_current_user_role() = ANY(ARRAY['admin', 'desenvolvedor']));

CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'client-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can upload documents for users"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'client-documents' AND get_current_user_role() = ANY(ARRAY['admin', 'desenvolvedor']));

-- Configurações padrão do sistema
INSERT INTO public.system_settings (key, value, description) VALUES
('min_bid_limit', '1000', 'Valor mínimo permitido para limite de lance'),
('default_bid_limit', '10000', 'Limite padrão para novos usuários'),
('max_file_size', '10485760', 'Tamanho máximo de arquivo em bytes (10MB)');

-- Função para estatísticas do dashboard
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