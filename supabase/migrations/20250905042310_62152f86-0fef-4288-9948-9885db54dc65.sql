-- Remover a constraint existente
ALTER TABLE public.plans DROP CONSTRAINT IF EXISTS plans_billing_cycle_check;

-- Adicionar nova constraint que aceita todos os valores usados no código
ALTER TABLE public.plans ADD CONSTRAINT plans_billing_cycle_check 
CHECK (billing_cycle IN ('weekly', 'monthly', 'quarterly', 'semiannual', 'annual', 'yearly', 'annually'));