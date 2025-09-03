-- Create integration settings table
CREATE TABLE public.integration_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_base_url text NOT NULL,
  api_login text NOT NULL,
  api_secret text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage integration settings" 
ON public.integration_settings 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'desenvolvedor'::text]));

-- Create integration jobs table
CREATE TABLE public.integration_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  last_error text,
  processed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.integration_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage integration jobs" 
ON public.integration_jobs 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'desenvolvedor'::text]));

-- Create integration logs table
CREATE TABLE public.integration_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES public.integration_jobs(id),
  endpoint text NOT NULL,
  request_payload jsonb,
  response_payload jsonb,
  status_code integer,
  success boolean NOT NULL DEFAULT false,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view integration logs" 
ON public.integration_logs 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'desenvolvedor'::text]));

-- Create triggers for updated_at
CREATE TRIGGER update_integration_settings_updated_at
BEFORE UPDATE ON public.integration_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_integration_jobs_updated_at
BEFORE UPDATE ON public.integration_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();