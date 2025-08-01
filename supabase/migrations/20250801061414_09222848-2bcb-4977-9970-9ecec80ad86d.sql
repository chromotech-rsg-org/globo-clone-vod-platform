-- Criar tabela de leilões
CREATE TABLE public.auctions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT,
  initial_bid_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  current_bid_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  bid_increment DECIMAL(10,2) NOT NULL DEFAULT 100,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive')),
  auction_type TEXT NOT NULL DEFAULT 'rural' CHECK (auction_type IN ('rural', 'judicial')),
  is_live BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de itens do leilão
CREATE TABLE public.auction_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  initial_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  current_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_current BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de habilitações
CREATE TABLE public.auction_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('approved', 'pending', 'rejected')),
  internal_notes TEXT,
  client_notes TEXT,
  approved_by UUID REFERENCES public.profiles(id),
  next_registration_allowed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, auction_id)
);

-- Criar tabela de lances
CREATE TABLE public.bids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  auction_item_id UUID NOT NULL REFERENCES public.auction_items(id) ON DELETE CASCADE,
  bid_value DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('approved', 'pending', 'rejected', 'superseded')),
  internal_notes TEXT,
  client_notes TEXT,
  approved_by UUID REFERENCES public.profiles(id),
  is_winner BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para auctions
CREATE POLICY "Auctions are viewable by everyone" 
ON public.auctions 
FOR SELECT 
USING (status = 'active');

CREATE POLICY "Admins can manage auctions" 
ON public.auctions 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'desenvolvedor'::text]));

-- Políticas RLS para auction_items
CREATE POLICY "Auction items are viewable by everyone" 
ON public.auction_items 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.auctions 
  WHERE auctions.id = auction_items.auction_id 
  AND auctions.status = 'active'
));

CREATE POLICY "Admins can manage auction items" 
ON public.auction_items 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'desenvolvedor'::text]));

-- Políticas RLS para auction_registrations
CREATE POLICY "Users can view own registrations" 
ON public.auction_registrations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own registrations" 
ON public.auction_registrations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all registrations" 
ON public.auction_registrations 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'desenvolvedor'::text]));

-- Políticas RLS para bids
CREATE POLICY "Users can view own bids" 
ON public.bids 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bids" 
ON public.bids 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all bids" 
ON public.bids 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'desenvolvedor'::text]));

-- Triggers para updated_at
CREATE TRIGGER update_auctions_updated_at
BEFORE UPDATE ON public.auctions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_auction_items_updated_at
BEFORE UPDATE ON public.auction_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_auction_registrations_updated_at
BEFORE UPDATE ON public.auction_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bids_updated_at
BEFORE UPDATE ON public.bids
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para verificar se usuário tem assinatura ativa
CREATE OR REPLACE FUNCTION public.user_has_active_subscription(user_uuid uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.subscriptions 
    WHERE user_id = user_uuid 
    AND status = 'active' 
    AND (end_date IS NULL OR end_date > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Função para verificar se usuário está habilitado para leilão
CREATE OR REPLACE FUNCTION public.user_is_registered_for_auction(user_uuid uuid, auction_uuid uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.auction_registrations 
    WHERE user_id = user_uuid 
    AND auction_id = auction_uuid 
    AND status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;