-- Add api_login column to integration_test_results table
ALTER TABLE public.integration_test_results 
ADD COLUMN api_login text;