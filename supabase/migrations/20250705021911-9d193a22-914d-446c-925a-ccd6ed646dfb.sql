-- Fix infinite recursion in other tables' RLS policies

-- Drop and recreate policies for customizations table
DROP POLICY IF EXISTS "Admins can manage customizations" ON public.customizations;
CREATE POLICY "Admins can manage customizations" 
ON public.customizations 
FOR ALL 
USING (public.get_current_user_role() IN ('admin', 'desenvolvedor'));

-- Drop and recreate policies for packages table  
DROP POLICY IF EXISTS "Admins can manage packages" ON public.packages;
CREATE POLICY "Admins can manage packages" 
ON public.packages 
FOR ALL 
USING (public.get_current_user_role() IN ('admin', 'desenvolvedor'));

-- Drop and recreate policies for coupons table
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
CREATE POLICY "Admins can manage coupons" 
ON public.coupons 
FOR ALL 
USING (public.get_current_user_role() IN ('admin', 'desenvolvedor'));

-- Drop and recreate policies for plans table
DROP POLICY IF EXISTS "Admins can manage plans" ON public.plans;
CREATE POLICY "Admins can manage plans" 
ON public.plans 
FOR ALL 
USING (public.get_current_user_role() IN ('admin', 'desenvolvedor'));

-- Drop and recreate policies for subscriptions table
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can view all subscriptions" 
ON public.subscriptions 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (public.get_current_user_role() IN ('admin', 'desenvolvedor'))
);