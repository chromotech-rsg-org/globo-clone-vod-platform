-- Update the status check constraint to include 'disabled' and 'reopened' statuses
ALTER TABLE public.auction_registrations 
DROP CONSTRAINT IF EXISTS auction_registrations_status_check;

ALTER TABLE public.auction_registrations 
ADD CONSTRAINT auction_registrations_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'canceled'::text, 'disabled'::text, 'reopened'::text]));