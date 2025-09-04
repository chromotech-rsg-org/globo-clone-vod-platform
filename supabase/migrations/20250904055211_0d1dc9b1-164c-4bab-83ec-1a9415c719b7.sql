-- Create table to persist admin integration API test history
CREATE TABLE IF NOT EXISTS public.integration_test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  endpoint text NOT NULL,
  method text NOT NULL,
  request_payload jsonb,
  response_payload jsonb,
  status_code integer,
  success boolean NOT NULL DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE public.integration_test_results ENABLE ROW LEVEL SECURITY;

-- Allow only admins and developers to manage/view
CREATE POLICY "Admins can manage integration test results"
ON public.integration_test_results
FOR ALL
USING (get_current_user_role() IN ('admin','desenvolvedor'))
WITH CHECK (get_current_user_role() IN ('admin','desenvolvedor'));

-- Helpful index for ordering
CREATE INDEX IF NOT EXISTS idx_integration_test_results_created_at
  ON public.integration_test_results (created_at DESC);
