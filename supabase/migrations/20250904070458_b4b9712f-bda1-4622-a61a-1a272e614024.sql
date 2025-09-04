-- Add vendor_id column to integration_settings table
ALTER TABLE public.integration_settings 
ADD COLUMN vendor_id integer DEFAULT 6843842;