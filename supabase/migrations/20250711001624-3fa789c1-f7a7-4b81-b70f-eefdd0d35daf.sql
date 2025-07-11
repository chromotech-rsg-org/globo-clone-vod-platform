-- Update the first user to be admin
UPDATE public.profiles 
SET role = 'admin', 
    updated_at = now() 
WHERE email = 'contato@chromotech.com.br';