-- Adicionar domínio personalizado às configurações CORS do Supabase
-- Atualizar origins permitidas para incluir o domínio personalizado

-- Configurar headers adequados para CORS e cache
-- Este é um comando administrativo que deve ser executado via console do Supabase
-- para adicionar https://minhaconta.agromercado.tv.br aos origins permitidos

-- Para contornar problemas de domínio personalizado, vamos criar uma view
-- que pode ajudar com cache de dados críticos

CREATE OR REPLACE VIEW public.admin_dashboard_cache AS
SELECT 
  'users' as table_name,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE role = 'admin') as admin_count,
  COUNT(*) FILTER (WHERE role = 'user') as user_count,
  now() as last_updated
FROM public.profiles

UNION ALL

SELECT 
  'auctions' as table_name,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE status = 'active') as active_count,
  COUNT(*) FILTER (WHERE status = 'inactive') as inactive_count,
  now() as last_updated
FROM public.auctions;

-- Garantir que a view é acessível
GRANT SELECT ON public.admin_dashboard_cache TO authenticated;

-- Criar uma função para verificar conectividade
CREATE OR REPLACE FUNCTION public.health_check()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'status', 'ok',
    'timestamp', now(),
    'user_id', auth.uid(),
    'database', 'connected'
  );
$$;