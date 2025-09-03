-- Create table to track read notifications for users
CREATE TABLE public.user_notification_reads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  notification_type text NOT NULL CHECK (notification_type IN ('bid', 'registration')),
  notification_id uuid NOT NULL,
  read_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_notification_reads ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own read notifications" 
ON public.user_notification_reads 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own read notifications" 
ON public.user_notification_reads 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_user_notification_reads_user_id ON public.user_notification_reads(user_id);
CREATE INDEX idx_user_notification_reads_notification ON public.user_notification_reads(notification_type, notification_id);

-- Create unique constraint to prevent duplicate reads
CREATE UNIQUE INDEX unique_user_notification_read ON public.user_notification_reads(user_id, notification_type, notification_id);