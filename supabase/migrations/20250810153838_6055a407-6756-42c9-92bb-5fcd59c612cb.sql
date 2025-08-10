-- Create default auction_items for existing auctions that don't have any items
INSERT INTO public.auction_items (auction_id, name, description, initial_value, current_value, is_current, order_index)
SELECT 
  a.id as auction_id,
  a.name as name,
  COALESCE(a.description, 'Item principal do leilão') as description,
  a.initial_bid_value as initial_value,
  a.current_bid_value as current_value,
  true as is_current,
  0 as order_index
FROM public.auctions a
WHERE NOT EXISTS (
  SELECT 1 FROM public.auction_items ai WHERE ai.auction_id = a.id
);

-- Update auction_items current_value to match auction current_bid_value for consistency
UPDATE public.auction_items 
SET current_value = (
  SELECT current_bid_value 
  FROM public.auctions 
  WHERE auctions.id = auction_items.auction_id
)
WHERE is_current = true;