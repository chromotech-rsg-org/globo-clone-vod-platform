-- Primeiro, vamos ajustar a função de auditoria para lidar com casos sem auth
CREATE OR REPLACE FUNCTION public.audit_profile_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Log role changes with enhanced security context
  IF OLD.role != NEW.role THEN
    INSERT INTO public.profile_audit_log (
      profile_id,
      modified_by,
      action,
      old_values,
      new_values
    ) VALUES (
      NEW.id,
      COALESCE(auth.uid(), NEW.id), -- Use the profile id itself if no auth user
      'ROLE_CHANGE',
      jsonb_build_object('role', OLD.role, 'timestamp', now()),
      jsonb_build_object('role', NEW.role, 'timestamp', now(), 'modifier_role', COALESCE(get_current_user_role(), 'system'))
    );
  END IF;
  
  RETURN NEW;
END;
$function$;