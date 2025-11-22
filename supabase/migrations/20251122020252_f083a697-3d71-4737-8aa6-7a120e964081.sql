-- FASE 1: Criar tabelas para integração Asaas

-- 1.1 Tabela de configurações do Asaas
CREATE TABLE IF NOT EXISTS asaas_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  environment TEXT NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
  sandbox_api_key TEXT,
  production_api_key TEXT,
  webhook_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_asaas_settings_updated_at
  BEFORE UPDATE ON asaas_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS: Apenas admins podem gerenciar
ALTER TABLE asaas_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage asaas settings" ON asaas_settings
  FOR ALL USING (get_current_user_role() IN ('admin', 'desenvolvedor'));

-- 1.2 Tabela de clientes Asaas
CREATE TABLE IF NOT EXISTS asaas_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  asaas_customer_id TEXT NOT NULL UNIQUE,
  environment TEXT NOT NULL CHECK (environment IN ('sandbox', 'production')),
  customer_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_asaas_customers_user ON asaas_customers(user_id);
CREATE INDEX idx_asaas_customers_asaas_id ON asaas_customers(asaas_customer_id);

CREATE TRIGGER update_asaas_customers_updated_at
  BEFORE UPDATE ON asaas_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE asaas_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own asaas customer" ON asaas_customers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all asaas customers" ON asaas_customers
  FOR ALL USING (get_current_user_role() IN ('admin', 'desenvolvedor'));

-- 1.3 Tabela de pagamentos Asaas
CREATE TABLE IF NOT EXISTS asaas_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  plan_id UUID NOT NULL REFERENCES plans(id),
  asaas_payment_id TEXT NOT NULL UNIQUE,
  asaas_customer_id TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('BOLETO', 'PIX', 'CREDIT_CARD')),
  value DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  due_date DATE,
  payment_date TIMESTAMPTZ,
  invoice_url TEXT,
  bank_slip_url TEXT,
  pix_qr_code TEXT,
  pix_copy_paste TEXT,
  credit_card_data JSONB,
  raw_data JSONB,
  environment TEXT NOT NULL CHECK (environment IN ('sandbox', 'production')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_asaas_payments_user ON asaas_payments(user_id);
CREATE INDEX idx_asaas_payments_status ON asaas_payments(status);
CREATE INDEX idx_asaas_payments_asaas_id ON asaas_payments(asaas_payment_id);

CREATE TRIGGER update_asaas_payments_updated_at
  BEFORE UPDATE ON asaas_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE asaas_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON asaas_payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all payments" ON asaas_payments
  FOR ALL USING (get_current_user_role() IN ('admin', 'desenvolvedor'));

-- 1.4 Tabela de eventos de webhook
CREATE TABLE IF NOT EXISTS asaas_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  asaas_payment_id TEXT,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_webhook_events_payment ON asaas_webhook_events(asaas_payment_id);
CREATE INDEX idx_webhook_events_processed ON asaas_webhook_events(processed);

ALTER TABLE asaas_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view webhook events" ON asaas_webhook_events
  FOR SELECT USING (get_current_user_role() IN ('admin', 'desenvolvedor'));

-- 1.5 Adicionar coluna para múltiplos métodos de pagamento nos planos
ALTER TABLE plans ADD COLUMN IF NOT EXISTS payment_methods TEXT[] DEFAULT ARRAY['CREDIT_CARD'];

-- Atualizar dados existentes baseado no payment_type atual
UPDATE plans 
SET payment_methods = ARRAY[
  CASE 
    WHEN payment_type = 'credit_card' THEN 'CREDIT_CARD'
    WHEN payment_type = 'pix' THEN 'PIX'
    WHEN payment_type = 'boleto' THEN 'BOLETO'
    ELSE 'CREDIT_CARD'
  END
]
WHERE payment_methods IS NULL OR payment_methods = ARRAY['CREDIT_CARD'];