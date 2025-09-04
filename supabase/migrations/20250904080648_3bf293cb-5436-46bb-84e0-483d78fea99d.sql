-- Create a simple function to update user motv_id
CREATE OR REPLACE FUNCTION public.update_user_motv_id(user_id uuid, new_motv_id text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.profiles 
  SET motv_user_id = new_motv_id, updated_at = now() 
  WHERE id = user_id;
$$;

-- Update the agro6 user directly
UPDATE public.profiles 
SET motv_user_id = '7073368', updated_at = now() 
WHERE name = 'agro6' AND email = 'agro5@agro5.com';

-- Create a sample subscription for agro6 user to show in plans
INSERT INTO public.subscriptions (user_id, plan_id, status, start_date, end_date)
SELECT 
  p.id as user_id,
  pl.id as plan_id,
  'active' as status,
  now() - interval '30 days' as start_date,
  now() + interval '30 days' as end_date
FROM public.profiles p
CROSS JOIN (SELECT id FROM public.plans WHERE active = true LIMIT 1) pl
WHERE p.name = 'agro6' AND p.email = 'agro5@agro5.com'
AND NOT EXISTS (
  SELECT 1 FROM public.subscriptions s 
  WHERE s.user_id = p.id
);