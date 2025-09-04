-- Update the agro6 user with the correct motv_user_id
UPDATE public.profiles 
SET motv_user_id = '7073368', updated_at = now() 
WHERE name = 'agro6' AND email = 'agro5@agro5.com';