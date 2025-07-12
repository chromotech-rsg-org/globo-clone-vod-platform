-- Alterar o role do usuário alexandre@chromotech.com.br para admin
UPDATE public.profiles 
SET role = 'admin', 
    updated_at = now() 
WHERE email = 'alexandre@chromotech.com.br';