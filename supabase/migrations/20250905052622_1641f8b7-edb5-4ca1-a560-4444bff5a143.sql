-- Criar a função get_current_user_role de forma mais robusta
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
    'user'
  );
$$;

-- Verificar se o usuário alexandre@rsggroup.com.br foi atualizado para admin
UPDATE public.profiles 
SET role = 'admin', updated_at = now() 
WHERE email = 'alexandre@rsggroup.com.br' AND role != 'admin';