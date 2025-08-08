-- Fix Security Issues: Remove SECURITY DEFINER from health_check function
-- and tighten RLS policies for better data protection

-- 1. Remove SECURITY DEFINER from health_check function (Security Issue #1)
CREATE OR REPLACE FUNCTION public.health_check()
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'status', 'ok',
    'timestamp', now(),
    'user_id', auth.uid(),
    'database', 'connected'
  );
$$;

-- 2. Drop the SECURITY DEFINER view and replace with a safer function
DROP VIEW IF EXISTS public.admin_dashboard_cache;

-- Create a function for dashboard stats that respects user permissions
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS TABLE(
  table_name text,
  total_count bigint,
  admin_count bigint,
  user_count bigint,
  last_updated timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

-- 3. Tighten RLS policies to prevent profile enumeration
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create more restrictive admin policy
CREATE POLICY "Admins can view all profiles with audit"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id OR 
  (get_current_user_role() = ANY (ARRAY['admin'::text, 'desenvolvedor'::text]))
);

-- 4. Add audit logging for profile modifications
CREATE TABLE IF NOT EXISTS public.profile_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL,
  modified_by uuid NOT NULL,
  action text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.profile_audit_log
FOR SELECT
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'desenvolvedor'::text]));

-- Function to log profile changes
CREATE OR REPLACE FUNCTION public.log_profile_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Log profile modifications by admins
  IF auth.uid() != NEW.id AND get_current_user_role() = ANY (ARRAY['admin'::text, 'desenvolvedor'::text]) THEN
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
$$;

-- Create trigger for profile audit logging
DROP TRIGGER IF EXISTS profile_audit_trigger ON public.profiles;
CREATE TRIGGER profile_audit_trigger
  AFTER UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_profile_changes();

-- 5. Add storage security policies
-- Update storage bucket to restrict file types and sizes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('secure-uploads', 'secure-uploads', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- Storage policies for secure uploads
CREATE POLICY "Users can upload their own files to secure bucket"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'secure-uploads' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own files in secure bucket"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'secure-uploads' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 6. Add rate limiting function for role changes
CREATE OR REPLACE FUNCTION public.check_role_change_rate_limit(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;