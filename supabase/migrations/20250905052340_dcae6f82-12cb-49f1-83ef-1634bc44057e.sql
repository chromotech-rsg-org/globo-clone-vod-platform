-- Simplesmente atualizar o usuário agora que a função existe
UPDATE public.profiles 
SET role = 'admin', updated_at = now() 
WHERE email = 'alexandre@rsggroup.com.br';