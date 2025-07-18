-- Add age_rating_background_color column to content_items table
ALTER TABLE public.content_items 
ADD COLUMN age_rating_background_color TEXT DEFAULT '#fbbf24';