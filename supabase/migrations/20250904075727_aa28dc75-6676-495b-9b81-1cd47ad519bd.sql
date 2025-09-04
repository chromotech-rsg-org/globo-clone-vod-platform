-- Fix security warnings by setting search_path for the function
DROP FUNCTION IF EXISTS public.enforce_single_active_api_config();

CREATE OR REPLACE FUNCTION public.enforce_single_active_api_config()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.is_active = true THEN
    -- Deactivate all other configs
    UPDATE public.motv_api_configs 
    SET is_active = false, updated_at = now()
    WHERE id != NEW.id AND is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$;