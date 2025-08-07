-- Add foreign key constraints to establish proper relationships

-- Add foreign key from bids.user_id to profiles.id
ALTER TABLE public.bids 
ADD CONSTRAINT bids_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key from bids.auction_id to auctions.id  
ALTER TABLE public.bids
ADD CONSTRAINT bids_auction_id_fkey
FOREIGN KEY (auction_id) REFERENCES public.auctions(id) ON DELETE CASCADE;

-- Add foreign key from auction_registrations.user_id to profiles.id
ALTER TABLE public.auction_registrations
ADD CONSTRAINT auction_registrations_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key from auction_registrations.auction_id to auctions.id
ALTER TABLE public.auction_registrations  
ADD CONSTRAINT auction_registrations_auction_id_fkey
FOREIGN KEY (auction_id) REFERENCES public.auctions(id) ON DELETE CASCADE;