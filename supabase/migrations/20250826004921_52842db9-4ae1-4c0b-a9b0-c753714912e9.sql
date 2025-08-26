
BEGIN;

-- 1) Ensure a default "Basic" plan exists
INSERT INTO public.plans (id, name, price, billing_cycle, payment_type, description, benefits, active, priority)
SELECT gen_random_uuid(), 'Basic', 0, 'monthly', 'credit_card', 'Plano básico padrão', ARRAY['Acesso básico'], true, 0
WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE lower(name)='basic');

-- 2) Function to obtain default plan id (prefer Basic; otherwise any active plan)
CREATE OR REPLACE FUNCTION public.get_default_plan_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $fn$
  WITH basic AS (
    SELECT id FROM public.plans WHERE active = true AND lower(name)='basic'
    ORDER BY priority DESC, created_at ASC
    LIMIT 1
  ),
  anyplan AS (
    SELECT id FROM public.plans WHERE active = true
    ORDER BY priority DESC, price ASC, created_at ASC
    LIMIT 1
  )
  SELECT COALESCE((SELECT id FROM basic), (SELECT id FROM anyplan));
$fn$;

-- 3) Add profiles.plan_id + FK and backfill
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_plan_id_fkey') THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_plan_id_fkey
      FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON UPDATE CASCADE;
  END IF;
END$$;

UPDATE public.profiles
SET plan_id = public.get_default_plan_id()
WHERE plan_id IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE plan_id IS NULL) THEN
    ALTER TABLE public.profiles ALTER COLUMN plan_id SET NOT NULL;
  END IF;
END$$;

-- 4) Update handle_new_user to set plan_id, and create trigger on auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $func$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, plan_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    'user',
    public.get_default_plan_id()
  );
  RETURN NEW;
END;
$func$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE PROCEDURE public.handle_new_user();
  END IF;
END$$;

-- 5) BEFORE INSERT trigger to set default plan on profiles if null
CREATE OR REPLACE FUNCTION public.set_default_plan_on_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $func$
BEGIN
  IF NEW.plan_id IS NULL THEN
    NEW.plan_id = public.get_default_plan_id();
  END IF;
  RETURN NEW;
END;
$func$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'profiles_set_default_plan') THEN
    CREATE TRIGGER profiles_set_default_plan
      BEFORE INSERT ON public.profiles
      FOR EACH ROW
      EXECUTE PROCEDURE public.set_default_plan_on_profile();
  END IF;
END$$;

-- 6) Enable Realtime for key tables
DO $$
BEGIN
  EXECUTE 'ALTER TABLE public.bids REPLICA IDENTITY FULL';
  EXECUTE 'ALTER TABLE public.auction_registrations REPLICA IDENTITY FULL';
  EXECUTE 'ALTER TABLE public.subscriptions REPLICA IDENTITY FULL';
EXCEPTION WHEN others THEN NULL;
END$$;

DO $$
BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.bids';
EXCEPTION WHEN others THEN NULL;
END$$;

DO $$
BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_registrations';
EXCEPTION WHEN others THEN NULL;
END$$;

DO $$
BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions';
EXCEPTION WHEN others THEN NULL;
END$$;

-- 7) Relax/extend status constraint for auction_registrations
ALTER TABLE public.auction_registrations DROP CONSTRAINT IF EXISTS auction_registrations_status_check;
ALTER TABLE public.auction_registrations
  ADD CONSTRAINT auction_registrations_status_check
  CHECK (status IN ('pending','approved','rejected','canceled','reopened'));

-- 8) RPC: reopen registration (user or admin/dev)
CREATE OR REPLACE FUNCTION public.reopen_registration(p_user uuid, p_auction uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  reg_id uuid;
BEGIN
  IF p_user IS NULL OR p_auction IS NULL THEN
    RAISE EXCEPTION 'Invalid parameters';
  END IF;

  IF auth.uid() != p_user AND public.get_current_user_role() NOT IN ('admin','desenvolvedor') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  UPDATE public.auction_registrations
     SET status = 'pending',
         updated_at = now()
   WHERE user_id = p_user
     AND auction_id = p_auction
     AND status = 'canceled'
   RETURNING id INTO reg_id;

  IF reg_id IS NULL THEN
    INSERT INTO public.auction_registrations (user_id, auction_id, status)
    VALUES (p_user, p_auction, 'pending')
    RETURNING id INTO reg_id;
  END IF;

  RETURN reg_id;
END;
$$;

-- 9) RPCs: change/cancel user plan
CREATE OR REPLACE FUNCTION public.change_user_plan(p_user uuid, p_new_plan uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  new_sub_id uuid;
BEGIN
  IF p_user IS NULL OR p_new_plan IS NULL THEN
    RAISE EXCEPTION 'Invalid parameters';
  END IF;

  IF auth.uid() != p_user AND public.get_current_user_role() NOT IN ('admin','desenvolvedor') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  UPDATE public.subscriptions
     SET status = 'canceled', end_date = now(), updated_at = now()
   WHERE user_id = p_user AND status = 'active';

  INSERT INTO public.subscriptions (user_id, plan_id, start_date, status)
  VALUES (p_user, p_new_plan, now(), 'active')
  RETURNING id INTO new_sub_id;

  UPDATE public.profiles SET plan_id = p_new_plan, updated_at = now() WHERE id = p_user;

  RETURN new_sub_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_user_plan(p_user uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF p_user IS NULL THEN
    RAISE EXCEPTION 'Invalid parameters';
  END IF;

  IF auth.uid() != p_user AND public.get_current_user_role() NOT IN ('admin','desenvolvedor') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  UPDATE public.subscriptions
     SET status = 'canceled', end_date = now(), updated_at = now()
   WHERE user_id = p_user AND status = 'active';

  RETURN true;
END;
$$;

-- 10) RBAC: only developers can assign developer role
CREATE OR REPLACE FUNCTION public.enforce_developer_role_only()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF NEW.role = 'desenvolvedor' AND public.get_current_user_role() != 'desenvolvedor' THEN
    RAISE EXCEPTION 'Only users with role desenvolvedor can create or assign developer roles';
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='profiles_enforce_developer_role') THEN
    CREATE TRIGGER profiles_enforce_developer_role
      BEFORE INSERT OR UPDATE ON public.profiles
      FOR EACH ROW
      EXECUTE PROCEDURE public.enforce_developer_role_only();
  END IF;
END$$;

-- 11) Adjust SELECT policy so admins cannot view developer profiles
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Admins can view all profiles with audit' AND tablename = 'profiles'
  ) THEN
    DROP POLICY "Admins can view all profiles with audit" ON public.profiles;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Developers can view all profiles' AND tablename = 'profiles'
  ) THEN
    CREATE POLICY "Developers can view all profiles"
      ON public.profiles
      FOR SELECT
      USING (public.get_current_user_role() = 'desenvolvedor');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Admins can view non-developer profiles' AND tablename = 'profiles'
  ) THEN
    CREATE POLICY "Admins can view non-developer profiles"
      ON public.profiles
      FOR SELECT
      USING (
        (auth.uid() = id)
        OR (public.get_current_user_role() = 'admin' AND role <> 'desenvolvedor')
      );
  END IF;
END$$;

-- 12) Keep updated_at fresh on update
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='bids_set_updated_at') THEN
    CREATE TRIGGER bids_set_updated_at BEFORE UPDATE ON public.bids
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='auction_registrations_set_updated_at') THEN
    CREATE TRIGGER auction_registrations_set_updated_at BEFORE UPDATE ON public.auction_registrations
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='subscriptions_set_updated_at') THEN
    CREATE TRIGGER subscriptions_set_updated_at BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='profiles_set_updated_at') THEN
    CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
  END IF;
END$$;

-- 13) RPC: set bid winner
CREATE OR REPLACE FUNCTION public.set_bid_winner(p_bid_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  _auction_id uuid;
  _item_id uuid;
BEGIN
  IF public.get_current_user_role() NOT IN ('admin','desenvolvedor') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT auction_id, auction_item_id INTO _auction_id, _item_id
  FROM public.bids WHERE id = p_bid_id;

  IF _item_id IS NULL THEN
    RAISE EXCEPTION 'Bid not found';
  END IF;

  UPDATE public.bids SET is_winner = false
  WHERE auction_item_id = _item_id AND id <> p_bid_id;

  UPDATE public.bids SET is_winner = true, status = 'approved', updated_at = now()
  WHERE id = p_bid_id;

  RETURN true;
END;
$$;

COMMIT;
