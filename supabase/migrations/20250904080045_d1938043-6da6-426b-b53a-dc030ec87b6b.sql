-- Recreate the get_current_user_role function if it doesn't exist
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Update the agro6 user with the correct motv_user_id
UPDATE public.profiles 
SET motv_user_id = '7073368', updated_at = now() 
WHERE name = 'agro6' AND email = 'agro5@agro5.com';