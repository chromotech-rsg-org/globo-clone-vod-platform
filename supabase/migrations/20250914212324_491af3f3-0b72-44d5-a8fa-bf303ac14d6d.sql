-- Add image_url column to auctions table
ALTER TABLE public.auctions 
ADD COLUMN image_url TEXT;