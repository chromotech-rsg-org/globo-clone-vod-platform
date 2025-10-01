-- Add support for limit request notifications in user_notification_reads table
-- The table already exists and supports different notification types via notification_type column
-- We just need to make sure limit_request is a valid type

-- Add a comment to document the supported notification types
COMMENT ON COLUMN public.user_notification_reads.notification_type IS 'Supported types: bid, registration, limit_request';

-- Create a table to store limit request responses for user notifications
CREATE TABLE IF NOT EXISTS public.limit_request_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.limit_increase_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  auction_id UUID,
  status TEXT NOT NULL CHECK (status IN ('approved', 'rejected')),
  new_limit NUMERIC,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  client_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.limit_request_responses ENABLE ROW LEVEL SECURITY;

-- Users can view their own limit responses
CREATE POLICY "Users can view own limit responses"
  ON public.limit_request_responses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can manage all limit responses
CREATE POLICY "Admins can manage limit responses"
  ON public.limit_request_responses
  FOR ALL
  USING (get_current_user_role() IN ('admin', 'desenvolvedor'));

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_limit_request_responses_user_id 
  ON public.limit_request_responses(user_id);

CREATE INDEX IF NOT EXISTS idx_limit_request_responses_request_id 
  ON public.limit_request_responses(request_id);