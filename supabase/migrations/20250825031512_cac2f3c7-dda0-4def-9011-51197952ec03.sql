
-- 1) Sanitizar customizations em INSERT/UPDATE
DROP TRIGGER IF EXISTS trg_customizations_sanitize ON public.customizations;
CREATE TRIGGER trg_customizations_sanitize
BEFORE INSERT OR UPDATE ON public.customizations
FOR EACH ROW
EXECUTE FUNCTION public.sanitize_customization_value();

-- 2) bids: validar lance (fixed/custom) e avançar item quando houver vencedor
DROP TRIGGER IF EXISTS trg_bids_validate_value ON public.bids;
CREATE TRIGGER trg_bids_validate_value
BEFORE INSERT OR UPDATE ON public.bids
FOR EACH ROW
EXECUTE FUNCTION public.validate_bid_value();

DROP TRIGGER IF EXISTS trg_bids_advance_next_item ON public.bids;
CREATE TRIGGER trg_bids_advance_next_item
AFTER UPDATE ON public.bids
FOR EACH ROW
EXECUTE FUNCTION public.advance_to_next_item_on_winner();

-- manter updated_at em bids
DROP TRIGGER IF EXISTS trg_bids_set_updated_at ON public.bids;
CREATE TRIGGER trg_bids_set_updated_at
BEFORE UPDATE ON public.bids
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 3) auction_items: garantir único item atual por leilão e atualizar updated_at
DROP TRIGGER IF EXISTS trg_auction_items_enforce_single_current ON public.auction_items;
CREATE TRIGGER trg_auction_items_enforce_single_current
BEFORE INSERT OR UPDATE ON public.auction_items
FOR EACH ROW
EXECUTE FUNCTION public.enforce_single_current_item();

DROP TRIGGER IF EXISTS trg_auction_items_set_updated_at ON public.auction_items;
CREATE TRIGGER trg_auction_items_set_updated_at
BEFORE UPDATE ON public.auction_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 4) auction_registrations: manter updated_at
DROP TRIGGER IF EXISTS trg_auction_registrations_set_updated_at ON public.auction_registrations;
CREATE TRIGGER trg_auction_registrations_set_updated_at
BEFORE UPDATE ON public.auction_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
