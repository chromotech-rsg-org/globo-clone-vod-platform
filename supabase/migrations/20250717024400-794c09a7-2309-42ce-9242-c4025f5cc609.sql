-- Corrigir CHECK constraint da tabela customizations para incluir 'admin'
-- Remove o constraint existente
ALTER TABLE public.customizations 
DROP CONSTRAINT IF EXISTS customizations_page_check;

-- Adiciona novo constraint incluindo 'admin'
ALTER TABLE public.customizations 
ADD CONSTRAINT customizations_page_check 
CHECK (page IN ('home', 'plans', 'login', 'admin'));