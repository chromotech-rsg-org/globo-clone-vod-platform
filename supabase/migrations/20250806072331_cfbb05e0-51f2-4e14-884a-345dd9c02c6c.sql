-- Criar auction_items para leilões existentes sem items
-- Cada leilão precisa ter pelo menos um item para os bids funcionarem

INSERT INTO public.auction_items (auction_id, name, description, initial_value, current_value, is_current, order_index)
SELECT 
  id as auction_id,
  name as name,
  description as description,
  initial_bid_value as initial_value,
  current_bid_value as current_value,
  true as is_current,
  0 as order_index
FROM public.auctions 
WHERE status = 'active'
AND id NOT IN (SELECT DISTINCT auction_id FROM public.auction_items WHERE auction_id IS NOT NULL);