
-- Criação da tabela de perfis de usuário
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  cpf TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'desenvolvedor')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de pacotes
CREATE TABLE public.packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  vendor_id TEXT,
  active BOOLEAN DEFAULT true,
  suspension_package BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de planos
CREATE TABLE public.plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  priority INTEGER DEFAULT 0,
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  best_seller BOOLEAN DEFAULT false,
  price DECIMAL(10,2) NOT NULL,
  free_days INTEGER DEFAULT 0,
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('weekly', 'monthly', 'quarterly', 'semiannual', 'annual')),
  payment_type TEXT DEFAULT 'credit_card' CHECK (payment_type IN ('boleto', 'credit_card', 'pix')),
  description TEXT,
  package_id UUID REFERENCES public.packages(id),
  benefits TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de cupons
CREATE TABLE public.coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  discount_percentage DECIMAL(5,2) NOT NULL,
  code TEXT UNIQUE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de assinaturas
CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.plans(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled', 'expired')),
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de personalização da interface
CREATE TABLE public.customizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page TEXT NOT NULL CHECK (page IN ('home', 'plans', 'login')),
  section TEXT NOT NULL,
  element_type TEXT NOT NULL CHECK (element_type IN ('image', 'text', 'color', 'logo', 'favicon')),
  element_key TEXT NOT NULL,
  element_value TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(page, section, element_key)
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY; 
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customizations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'desenvolvedor')
    )
  );

CREATE POLICY "Admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'desenvolvedor')
    )
  );

-- Políticas para planos (visível para todos, editável apenas por admins)
CREATE POLICY "Plans are viewable by everyone" ON public.plans
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage plans" ON public.plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'desenvolvedor')
    )
  );

-- Políticas para packages (apenas admins)
CREATE POLICY "Admins can manage packages" ON public.packages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'desenvolvedor')
    )
  );

-- Políticas para cupons (visível para todos, editável por admins)
CREATE POLICY "Active coupons are viewable by everyone" ON public.coupons
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage coupons" ON public.coupons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'desenvolvedor')
    )
  );

-- Políticas para subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'desenvolvedor')
    )
  );

-- Políticas para customizations (visível para todos, editável por admins)
CREATE POLICY "Customizations are viewable by everyone" ON public.customizations
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage customizations" ON public.customizations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'desenvolvedor')
    )
  );

-- Inserir dados iniciais para teste
INSERT INTO public.packages (name, code, vendor_id, active) VALUES
('Globoplay Premiere', 'GP_PREMIERE', 'premiere', true),
('Globoplay Cartola', 'GP_CARTOLA', 'cartola', true),
('Globoplay Telecine', 'GP_TELECINE', 'telecine', true),
('Globoplay Combate', 'GP_COMBATE', 'combate', true);

INSERT INTO public.plans (priority, name, active, best_seller, price, billing_cycle, description, benefits) VALUES
(1, 'Globoplay Premiere', true, true, 36.90, 'monthly', 'Plano Padrão com Anúncios', ARRAY['Globoplay completo', 'Premiere sem anúncios', 'Canais ao vivo', 'Download para offline']),
(2, 'Globoplay Cartola', true, false, 15.40, 'monthly', 'Plano Padrão com Anúncios', ARRAY['Globoplay completo', 'Cartola FC Premium', 'Estatísticas exclusivas', 'Download para offline']),
(3, 'Globoplay Telecine', true, false, 29.90, 'monthly', 'Plano Padrão com Anúncios', ARRAY['Globoplay completo', 'Telecine sem anúncios', 'Filmes em primeira mão', 'Download para offline']),
(4, 'Globoplay Combate', true, false, 28.80, 'monthly', 'Plano Padrão com Anúncios', ARRAY['Globoplay completo', 'Combate sem anúncios', 'Lutas ao vivo', 'Download para offline']);

-- Inserir customizações padrão
INSERT INTO public.customizations (page, section, element_type, element_key, element_value) VALUES
('home', 'hero', 'text', 'title', 'Seja bem-vindo ao Globoplay'),
('home', 'hero', 'text', 'subtitle', 'O melhor do entretenimento brasileiro'),
('plans', 'header', 'text', 'title', 'Combos Globoplay Plano Padrão com Anúncios'),
('plans', 'header', 'text', 'subtitle', 'O melhor catálogo de conteúdo para você!'),
('login', 'form', 'text', 'title', 'Entrar'),
('login', 'form', 'text', 'subtitle', 'Acesse sua conta do Globoplay');
