
-- Remove as políticas problemáticas e recria elas de forma correta
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Cria políticas mais simples que não causam recursão
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users only"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Política para admins visualizarem todos os perfis (sem recursão)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'desenvolvedor')
  );

-- Remove políticas problemáticas de outras tabelas também
DROP POLICY IF EXISTS "Admins can manage customizations" ON public.customizations;
DROP POLICY IF EXISTS "Admins can manage packages" ON public.packages;
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can manage plans" ON public.plans;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;

-- Recria as políticas sem recursão
CREATE POLICY "Admins can manage customizations"
  ON public.customizations
  FOR ALL
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'desenvolvedor')
  );

CREATE POLICY "Admins can manage packages"
  ON public.packages
  FOR ALL
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'desenvolvedor')
  );

CREATE POLICY "Admins can manage coupons"
  ON public.coupons
  FOR ALL
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'desenvolvedor')
  );

CREATE POLICY "Admins can manage plans"
  ON public.plans
  FOR ALL
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'desenvolvedor')
  );

CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (
    auth.uid() = user_id OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'desenvolvedor')
  );
