-- Add MOTV user ID field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN motv_user_id TEXT;

-- Add index for better performance on lookups
CREATE INDEX idx_profiles_motv_user_id ON public.profiles(motv_user_id);

-- Add comment to document the field purpose
COMMENT ON COLUMN public.profiles.motv_user_id IS 'External user ID returned by MOTV API when user is created via integration';