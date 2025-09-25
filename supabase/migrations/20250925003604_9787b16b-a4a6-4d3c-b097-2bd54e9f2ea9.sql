-- Fix security issues by setting search_path for functions that don't have it set

-- Update function that was missing search_path
CREATE OR REPLACE FUNCTION public.user_has_active_subscription(user_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
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

-- Update function that was missing search_path
CREATE OR REPLACE FUNCTION public.user_is_registered_for_auction(user_uuid uuid, auction_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
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

-- Update function that was missing search_path
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
 RETURNS TABLE(table_name text, total_count bigint, admin_count bigint, user_count bigint, last_updated timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow admins and developers to access dashboard stats
  IF get_current_user_role() NOT IN ('admin', 'desenvolvedor') THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    'users'::text as table_name,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE role = 'admin') as admin_count,
    COUNT(*) FILTER (WHERE role = 'user') as user_count,
    now() as last_updated
  FROM public.profiles

  UNION ALL

  SELECT 
    'auctions'::text as table_name,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE status = 'active') as active_count,
    COUNT(*) FILTER (WHERE status = 'inactive') as inactive_count,
    now() as last_updated
  FROM public.auctions;
END;
$function$;

-- Update function that was missing search_path
CREATE OR REPLACE FUNCTION public.check_role_change_rate_limit(user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  recent_changes integer;
BEGIN
  -- Count role changes in the last hour
  SELECT COUNT(*) INTO recent_changes
  FROM public.profile_audit_log
  WHERE profile_id = user_id
    AND action = 'UPDATE'
    AND new_values->>'role' != old_values->>'role'
    AND created_at > now() - interval '1 hour';
  
  -- Allow max 3 role changes per hour
  RETURN recent_changes < 3;
END;
$function$;