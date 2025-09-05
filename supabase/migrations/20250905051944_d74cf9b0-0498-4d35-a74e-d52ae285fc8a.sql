-- Criar função get_current_user_role se não existir
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;