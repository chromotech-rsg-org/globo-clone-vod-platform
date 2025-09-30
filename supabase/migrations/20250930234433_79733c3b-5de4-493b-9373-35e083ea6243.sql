-- Create table for failed bid attempts (when user hits limit)
CREATE TABLE public.failed_bid_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  auction_id UUID NOT NULL,
  auction_item_id UUID NOT NULL,
  attempted_bid_value NUMERIC NOT NULL,
  current_limit NUMERIC NOT NULL,
  total_bids_at_attempt NUMERIC NOT NULL,
  reason TEXT NOT NULL DEFAULT 'limit_exceeded',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.failed_bid_attempts ENABLE ROW LEVEL SECURITY;

-- Policies for failed_bid_attempts
CREATE POLICY "Users can view own failed attempts"
ON public.failed_bid_attempts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own failed attempts"
ON public.failed_bid_attempts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all failed attempts"
ON public.failed_bid_attempts
FOR SELECT
USING (get_current_user_role() IN ('admin', 'desenvolvedor'));

-- Add index for better performance
CREATE INDEX idx_failed_bid_attempts_user_id ON public.failed_bid_attempts(user_id);
CREATE INDEX idx_failed_bid_attempts_auction_id ON public.failed_bid_attempts(auction_id);
CREATE INDEX idx_failed_bid_attempts_created_at ON public.failed_bid_attempts(created_at DESC);

-- Ensure limit_increase_requests table exists with proper structure
-- (This table was mentioned in the plan but may need to be created)
CREATE TABLE IF NOT EXISTS public.limit_increase_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  current_limit NUMERIC NOT NULL,
  requested_limit NUMERIC NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on limit_increase_requests if not already
ALTER TABLE public.limit_increase_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Users can view own requests" ON public.limit_increase_requests;
DROP POLICY IF EXISTS "Users can create own requests" ON public.limit_increase_requests;
DROP POLICY IF EXISTS "Admins can manage limit requests" ON public.limit_increase_requests;

CREATE POLICY "Users can view own requests"
ON public.limit_increase_requests
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own requests"
ON public.limit_increase_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage limit requests"
ON public.limit_increase_requests
FOR ALL
USING (get_current_user_role() IN ('admin', 'desenvolvedor'));

-- Add trigger for updated_at
CREATE TRIGGER update_limit_increase_requests_updated_at
BEFORE UPDATE ON public.limit_increase_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();