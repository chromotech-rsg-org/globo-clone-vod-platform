-- Add pre-bidding support to auctions table
ALTER TABLE public.auctions 
ADD COLUMN allow_pre_bidding boolean DEFAULT false;