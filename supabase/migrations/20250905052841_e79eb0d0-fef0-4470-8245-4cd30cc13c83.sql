-- Atualizar o usuário para admin agora que as funções estão corretas
UPDATE public.profiles 
SET role = 'admin', updated_at = now() 
WHERE email = 'alexandre@rsggroup.com.br';