-- 1. Adicionar campos de origem do lance na tabela bids
ALTER TABLE bids 
ADD COLUMN IF NOT EXISTS bid_origin text DEFAULT 'live',
ADD COLUMN IF NOT EXISTS lot_status_at_bid text;

-- 2. Criar índices para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_bids_origin ON bids(bid_origin);
CREATE INDEX IF NOT EXISTS idx_bids_lot_status ON bids(lot_status_at_bid);

-- 3. Adicionar comentários para documentação
COMMENT ON COLUMN bids.bid_origin IS 'Origem do lance: pre_bidding ou live';
COMMENT ON COLUMN bids.lot_status_at_bid IS 'Status do lote no momento em que o lance foi feito';