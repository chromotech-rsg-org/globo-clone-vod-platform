
-- 1) Habilitar REPLICA IDENTITY FULL nas tabelas que usamos em realtime
ALTER TABLE public.bids REPLICA IDENTITY FULL;
ALTER TABLE public.auction_registrations REPLICA IDENTITY FULL;
ALTER TABLE public.auctions REPLICA IDENTITY FULL;
ALTER TABLE public.customizations REPLICA IDENTITY FULL;
ALTER TABLE public.subscriptions REPLICA IDENTITY FULL;

-- 2) Adicionar tabelas à publicação supabase_realtime (com tratamento para duplicidade)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.bids;
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_registrations;
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.auctions;
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.customizations;
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;

-- 3) Permitir status 'canceled' nas habilitações
ALTER TABLE public.auction_registrations 
  DROP CONSTRAINT IF EXISTS auction_registrations_status_check;

ALTER TABLE public.auction_registrations 
  ADD CONSTRAINT auction_registrations_status_check 
  CHECK (status IN ('pending','approved','rejected','canceled'));
