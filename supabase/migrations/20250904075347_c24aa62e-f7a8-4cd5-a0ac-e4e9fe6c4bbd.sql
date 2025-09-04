-- Create table for multiple API configurations
CREATE TABLE public.motv_api_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  api_base_url TEXT NOT NULL,
  api_login TEXT NOT NULL,
  api_secret TEXT NOT NULL,
  vendor_id INTEGER,
  is_production BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.motv_api_configs ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admin can manage API configs" 
ON public.motv_api_configs 
FOR ALL 
USING (get_current_user_role() IN ('admin', 'desenvolvedor'))
WITH CHECK (get_current_user_role() IN ('admin', 'desenvolvedor'));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_motv_api_configs_updated_at
BEFORE UPDATE ON public.motv_api_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to ensure only one active API config at a time
CREATE OR REPLACE FUNCTION public.enforce_single_active_api_config()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    -- Deactivate all other configs
    UPDATE public.motv_api_configs 
    SET is_active = false, updated_at = now()
    WHERE id != NEW.id AND is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to enforce single active config
CREATE TRIGGER enforce_single_active_api_config_trigger
BEFORE INSERT OR UPDATE ON public.motv_api_configs
FOR EACH ROW
EXECUTE FUNCTION public.enforce_single_active_api_config();

-- Migrate existing settings if any exist
DO $$
DECLARE
  existing_settings RECORD;
BEGIN
  -- Check if integration_settings table exists and has data
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'integration_settings') THEN
    SELECT * INTO existing_settings FROM public.integration_settings LIMIT 1;
    
    IF FOUND THEN
      INSERT INTO public.motv_api_configs (
        name,
        api_base_url,
        api_login,
        api_secret,
        vendor_id,
        is_production,
        is_active
      ) VALUES (
        'Configuração Principal',
        existing_settings.api_base_url,
        COALESCE(existing_settings.api_login, 'agroplay.api'),
        existing_settings.api_secret,
        COALESCE(existing_settings.vendor_id, 6843842),
        true,
        true
      );
    END IF;
  END IF;
END $$;