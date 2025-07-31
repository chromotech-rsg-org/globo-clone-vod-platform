-- Atualizar RLS policies da tabela subscriptions para permitir INSERT e UPDATE

-- Política para permitir INSERT de assinaturas
CREATE POLICY "Users can create their own subscriptions" ON public.subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política para permitir UPDATE de assinaturas próprias
CREATE POLICY "Users can update their own subscriptions" ON public.subscriptions
FOR UPDATE
USING (auth.uid() = user_id);

-- Política para admins gerenciarem todas as assinaturas
CREATE POLICY "Admins can manage all subscriptions" ON public.subscriptions
FOR ALL
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'desenvolvedor'::text]));

-- Adicionar função para obter assinatura ativa do usuário
CREATE OR REPLACE FUNCTION public.get_user_active_subscription(user_uuid uuid)
RETURNS TABLE(
  id uuid,
  plan_id uuid,
  status text,
  start_date timestamptz,
  end_date timestamptz
) 
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT s.id, s.plan_id, s.status, s.start_date, s.end_date
  FROM public.subscriptions s
  WHERE s.user_id = user_uuid 
  AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;
$$;