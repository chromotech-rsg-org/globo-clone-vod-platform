-- Clean up duplicate bids (keep the latest one for each auction_item_id, bid_value pair)
DELETE FROM public.bids 
WHERE id NOT IN (
  SELECT DISTINCT ON (auction_item_id, bid_value) id
  FROM public.bids 
  ORDER BY auction_item_id, bid_value, created_at DESC
);

-- Now add the unique constraint
ALTER TABLE public.bids 
ADD CONSTRAINT unique_bid_per_lot_value 
UNIQUE (auction_item_id, bid_value);

-- Update auction_items table to support lots
ALTER TABLE public.auction_items 
ADD COLUMN IF NOT EXISTS increment numeric,
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'not_started';

-- Add check constraint for status
ALTER TABLE public.auction_items 
DROP CONSTRAINT IF EXISTS auction_item_status_check;
ALTER TABLE public.auction_items 
ADD CONSTRAINT auction_item_status_check 
CHECK (status IN ('not_started', 'in_progress', 'finished'));

-- Update bids table to default to approved status
ALTER TABLE public.bids 
ALTER COLUMN status SET DEFAULT 'approved';