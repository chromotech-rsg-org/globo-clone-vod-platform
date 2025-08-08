-- Update the RLS policy for bids to allow viewing all bids for transparency
-- Users should be able to see all bids in an auction for transparency
-- but only create their own bids

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view own bids" ON bids;

-- Create a new policy that allows viewing all bids for registered users
CREATE POLICY "Users can view all auction bids" 
ON bids 
FOR SELECT 
USING (
  -- Allow admins to see all bids
  get_current_user_role() = ANY (ARRAY['admin'::text, 'desenvolvedor'::text])
  OR 
  -- Allow authenticated users to see all bids (for auction transparency)
  auth.uid() IS NOT NULL
);

-- Update the insert policy to be more explicit
DROP POLICY IF EXISTS "Users can create own bids" ON bids;

CREATE POLICY "Users can create own bids" 
ON bids 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND auth.uid() IS NOT NULL
);