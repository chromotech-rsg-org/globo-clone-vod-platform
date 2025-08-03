-- Enable realtime for bids table
ALTER TABLE public.bids REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bids;

-- Enable realtime for auction_registrations table  
ALTER TABLE public.auction_registrations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_registrations;