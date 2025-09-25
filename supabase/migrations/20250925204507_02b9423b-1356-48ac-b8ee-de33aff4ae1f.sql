-- Add broadcast_enabled column to auctions table
ALTER TABLE public.auctions 
ADD COLUMN broadcast_enabled BOOLEAN NOT NULL DEFAULT true;