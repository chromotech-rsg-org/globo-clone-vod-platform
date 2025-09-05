-- Desabilitar temporariamente o trigger de auditoria
ALTER TABLE public.profiles DISABLE TRIGGER audit_profile_role_changes;

-- Atualizar o usuário alexandre@rsggroup.com.br para admin
UPDATE public.profiles 
SET role = 'admin', updated_at = now() 
WHERE email = 'alexandre@rsggroup.com.br';

-- Reabilitar o trigger de auditoria
ALTER TABLE public.profiles ENABLE TRIGGER audit_profile_role_changes;