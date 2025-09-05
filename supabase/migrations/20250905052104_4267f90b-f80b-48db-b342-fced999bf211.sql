-- Simplesmente atualizar o usuário para admin
UPDATE public.profiles 
SET role = 'admin', updated_at = now() 
WHERE email = 'alexandre@rsggroup.com.br';