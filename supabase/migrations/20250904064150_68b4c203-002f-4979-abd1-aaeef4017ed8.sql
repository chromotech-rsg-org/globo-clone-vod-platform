-- Add user_id column to integration_test_results table to track who initiated each test
ALTER TABLE public.integration_test_results 
ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Add user_id column to integration_jobs table to track who initiated each job
ALTER TABLE public.integration_jobs 
ADD COLUMN user_id uuid REFERENCES auth.users(id);