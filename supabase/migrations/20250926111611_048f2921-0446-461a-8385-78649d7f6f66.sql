-- Drop the existing check constraint
ALTER TABLE public.auction_items DROP CONSTRAINT IF EXISTS auction_item_status_check;

-- Add the updated check constraint with pre_bidding status
ALTER TABLE public.auction_items ADD CONSTRAINT auction_item_status_check 
CHECK (status IN ('not_started', 'pre_bidding', 'in_progress', 'finished', 'indisponivel'));