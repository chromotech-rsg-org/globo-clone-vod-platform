
-- Corrigir chaves duplicadas e inconsistentes na tabela customizations
-- Remover duplicações de chaves hero_hero_* 
DELETE FROM public.customizations 
WHERE page = 'home' 
AND section = 'hero' 
AND element_key LIKE 'hero_hero_%';

-- Padronizar chaves do hero para formato correto
UPDATE public.customizations 
SET element_key = REPLACE(element_key, 'hero_hero_', 'hero_')
WHERE page = 'home' 
AND section = 'hero' 
AND element_key LIKE 'hero_hero_%';

-- Corrigir chaves da página de login para formato consistente
UPDATE public.customizations 
SET element_key = 'login_title'
WHERE page = 'login' 
AND section = 'form' 
AND element_key = 'title';

UPDATE public.customizations 
SET element_key = 'login_subtitle'
WHERE page = 'login' 
AND section = 'form' 
AND element_key = 'subtitle';

UPDATE public.customizations 
SET element_key = 'login_background_color'
WHERE page = 'login' 
AND section = 'background' 
AND element_key = 'color';

UPDATE public.customizations 
SET element_key = 'login_background_image'
WHERE page = 'login' 
AND section = 'background' 
AND element_key = 'image';

UPDATE public.customizations 
SET element_key = 'login_card_background_color'
WHERE page = 'login' 
AND section = 'card' 
AND element_key = 'background';

-- Garantir que configurações globais estejam com chaves corretas
UPDATE public.customizations 
SET element_key = 'global_site_name'
WHERE page = 'home' 
AND section = 'global' 
AND element_key = 'site_name';

UPDATE public.customizations 
SET element_key = 'global_site_background_color'
WHERE page = 'home' 
AND section = 'global' 
AND element_key = 'site_background_color';

UPDATE public.customizations 
SET element_key = 'global_primary_color'
WHERE page = 'home' 
AND section = 'global' 
AND element_key = 'primary_color';

UPDATE public.customizations 
SET element_key = 'global_secondary_color'
WHERE page = 'home' 
AND section = 'global' 
AND element_key = 'secondary_color';
