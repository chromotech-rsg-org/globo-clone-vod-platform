-- Primeiro, corrigir a função log_profile_changes que está causando erro
CREATE OR REPLACE FUNCTION public.log_profile_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log profile modifications by admins (simplified version)
  IF auth.uid() != NEW.id THEN
    INSERT INTO public.profile_audit_log (
      profile_id,
      modified_by,
      action,
      old_values,
      new_values
    ) VALUES (
      NEW.id,
      auth.uid(),
      TG_OP,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Agora criar a função get_current_user_role
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