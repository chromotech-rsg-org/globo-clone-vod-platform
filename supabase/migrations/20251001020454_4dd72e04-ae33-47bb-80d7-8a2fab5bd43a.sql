-- Allow 'limit_request' in notification type
ALTER TABLE public.user_notification_reads
DROP CONSTRAINT IF EXISTS user_notification_reads_notification_type_check;

ALTER TABLE public.user_notification_reads
ADD CONSTRAINT user_notification_reads_notification_type_check
CHECK (notification_type IN ('bid', 'registration', 'limit_request'));
