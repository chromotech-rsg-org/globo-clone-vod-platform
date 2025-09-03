-- Adicionar campo unique_package na tabela packages
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS unique_package boolean DEFAULT false;

-- Criar tabela plan_packages para relacionar planos com pacotes
CREATE TABLE IF NOT EXISTS public.plan_packages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id uuid NOT NULL,
  package_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(plan_id, package_id)
);

-- Habilitar RLS
ALTER TABLE public.plan_packages ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para plan_packages
CREATE POLICY "Admins can manage plan packages" 
ON public.plan_packages 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'desenvolvedor'::text]));

-- Trigger para updated_at na tabela plan_packages
CREATE TRIGGER update_plan_packages_updated_at
  BEFORE UPDATE ON public.plan_packages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();