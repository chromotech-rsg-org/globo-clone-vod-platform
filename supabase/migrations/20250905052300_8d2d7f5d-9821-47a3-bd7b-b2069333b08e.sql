-- Recriar a função sem fazer drop
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Tentar atualizar com triggers desabilitados temporariamente
ALTER TABLE public.profiles DISABLE TRIGGER ALL;

UPDATE public.profiles 
SET role = 'admin', updated_at = now() 
WHERE email = 'alexandre@rsggroup.com.br';

ALTER TABLE public.profiles ENABLE TRIGGER ALL;