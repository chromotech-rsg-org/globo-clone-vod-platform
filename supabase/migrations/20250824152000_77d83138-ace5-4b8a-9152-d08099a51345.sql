
-- 1. Fix critical privilege escalation in profiles table
-- Remove the ability for users to update their own role
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile (no role)" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- 2. Secure the bids table - users should only see bids for auctions they're registered for
DROP POLICY IF EXISTS "Users can view all auction bids" ON public.bids;

CREATE POLICY "Users can view bids for registered auctions" 
  ON public.bids 
  FOR SELECT 
  USING (
    (get_current_user_role() = ANY (ARRAY['admin'::text, 'desenvolvedor'::text])) OR
    (
      auth.uid() IS NOT NULL AND 
      EXISTS (
        SELECT 1 FROM public.auction_registrations ar 
        WHERE ar.user_id = auth.uid() 
        AND ar.auction_id = bids.auction_id 
        AND ar.status = 'approved'
      )
    )
  );

-- 3. Add audit trigger for profile changes
CREATE OR REPLACE FUNCTION public.audit_profile_role_changes()
RETURNS TRIGGER AS $$
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
      auth.uid(),
      'ROLE_CHANGE',
      jsonb_build_object('role', OLD.role, 'timestamp', now()),
      jsonb_build_object('role', NEW.role, 'timestamp', now(), 'modifier_role', get_current_user_role())
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for profile role changes
DROP TRIGGER IF EXISTS audit_profile_role_changes_trigger ON public.profiles;
CREATE TRIGGER audit_profile_role_changes_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_profile_role_changes();

-- 4. Add rate limiting trigger for role changes
CREATE OR REPLACE FUNCTION public.enforce_role_change_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  recent_changes integer;
BEGIN
  -- Only enforce rate limiting for non-admin role changes
  if OLD.role != NEW.role AND get_current_user_role() != 'desenvolvedor' THEN
    SELECT COUNT(*) INTO recent_changes
    FROM public.profile_audit_log
    WHERE profile_id = NEW.id
      AND action = 'ROLE_CHANGE'
      AND created_at > now() - interval '1 hour';
    
    IF recent_changes >= 3 THEN
      RAISE EXCEPTION 'Rate limit exceeded: Too many role changes in the last hour';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create rate limiting trigger
DROP TRIGGER IF EXISTS enforce_role_change_rate_limit_trigger ON public.profiles;
CREATE TRIGGER enforce_role_change_rate_limit_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_role_change_rate_limit();

-- 5. Secure RPC functions by adding input validation
CREATE OR REPLACE FUNCTION public.user_has_active_subscription(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Input validation
  IF user_uuid IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Only allow users to check their own subscription or admins to check any
  IF auth.uid() != user_uuid AND get_current_user_role() NOT IN ('admin', 'desenvolvedor') THEN
    RAISE EXCEPTION 'Access denied: Cannot check subscription for other users';
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.subscriptions 
    WHERE user_id = user_uuid 
    AND status = 'active' 
    AND (end_date IS NULL OR end_date > now())
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.user_is_registered_for_auction(user_uuid uuid, auction_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Input validation
  IF user_uuid IS NULL OR auction_uuid IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Only allow users to check their own registration or admins to check any
  IF auth.uid() != user_uuid AND get_current_user_role() NOT IN ('admin', 'desenvolvedor') THEN
    RAISE EXCEPTION 'Access denied: Cannot check registration for other users';
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.auction_registrations 
    WHERE user_id = user_uuid 
    AND auction_id = auction_uuid 
    AND status = 'approved'
  );
END;
$function$;

-- 6. Add input sanitization for customizations
CREATE OR REPLACE FUNCTION public.sanitize_customization_value()
RETURNS TRIGGER AS $$
BEGIN
  -- Sanitize element_value to prevent XSS
  IF NEW.element_value IS NOT NULL THEN
    -- Remove potentially dangerous content
    NEW.element_value = regexp_replace(NEW.element_value, '<script[^>]*>.*?</script>', '', 'gi');
    NEW.element_value = regexp_replace(NEW.element_value, 'javascript:', '', 'gi');
    NEW.element_value = regexp_replace(NEW.element_value, 'on\w+\s*=', '', 'gi');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sanitization trigger for customizations
DROP TRIGGER IF EXISTS sanitize_customization_trigger ON public.customizations;
CREATE TRIGGER sanitize_customization_trigger
  BEFORE INSERT OR UPDATE ON public.customizations
  FOR EACH ROW
  EXECUTE FUNCTION public.sanitize_customization_value();
