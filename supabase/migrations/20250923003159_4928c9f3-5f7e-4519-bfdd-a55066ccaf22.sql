-- Add field to track manual deactivations by admin
ALTER TABLE public.auction_registrations 
ADD COLUMN manually_disabled_by uuid,
ADD COLUMN manually_disabled_at timestamp with time zone;