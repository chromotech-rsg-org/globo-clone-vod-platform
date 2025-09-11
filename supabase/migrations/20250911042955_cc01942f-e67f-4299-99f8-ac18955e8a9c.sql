-- Corrigir lote atual sem incremento
UPDATE auction_items 
SET increment = 100, status = 'in_progress' 
WHERE auction_id = 'b3523a34-5880-4877-9cfe-06443c1e7741' 
AND increment IS NULL;

-- Garantir que há um trigger para aprovar lances automaticamente
DROP TRIGGER IF EXISTS auto_approve_bid_trigger ON bids;
CREATE TRIGGER auto_approve_bid_trigger
  BEFORE INSERT ON bids
  FOR EACH ROW
  EXECUTE FUNCTION auto_approve_bid();

-- Garantir que há um trigger para validar valor do lance
DROP TRIGGER IF EXISTS validate_bid_value_trigger ON bids;
CREATE TRIGGER validate_bid_value_trigger
  BEFORE INSERT ON bids
  FOR EACH ROW
  EXECUTE FUNCTION validate_bid_value();