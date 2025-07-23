
-- Remover chaves duplicadas hero_hero_* que estão causando conflitos
DELETE FROM public.customizations 
WHERE page = 'home' 
AND section = 'hero' 
AND element_key LIKE 'hero_hero_%';

-- Corrigir chaves mal formatadas que não seguem o padrão section_key
UPDATE public.customizations 
SET element_key = 'hero_slider_images'
WHERE page = 'home' 
AND section = 'hero' 
AND element_key = 'slider_images';

UPDATE public.customizations 
SET element_key = 'hero_slider_autoplay_duration'
WHERE page = 'home' 
AND section = 'hero' 
AND element_key = 'slider_autoplay_duration';

-- Padronizar chaves do header
UPDATE public.customizations 
SET element_key = 'header_logo_image'
WHERE page = 'home' 
AND section = 'header' 
AND element_key = 'logo_image';

UPDATE public.customizations 
SET element_key = 'header_background_color'
WHERE page = 'home' 
AND section = 'header' 
AND element_key = 'background_color';

UPDATE public.customizations 
SET element_key = 'header_text_color'
WHERE page = 'home' 
AND section = 'header' 
AND element_key = 'text_color';

UPDATE public.customizations 
SET element_key = 'header_hover_color'
WHERE page = 'home' 
AND section = 'header' 
AND element_key = 'hover_color';

-- Padronizar chaves do footer
UPDATE public.customizations 
SET element_key = 'footer_footer_logo_image'
WHERE page = 'home' 
AND section = 'footer' 
AND element_key = 'footer_logo_image';

UPDATE public.customizations 
SET element_key = 'footer_footer_copyright'
WHERE page = 'home' 
AND section = 'footer' 
AND element_key = 'footer_copyright';

UPDATE public.customizations 
SET element_key = 'footer_footer_background_color'
WHERE page = 'home' 
AND section = 'footer' 
AND element_key = 'footer_background_color';

UPDATE public.customizations 
SET element_key = 'footer_footer_text_color'
WHERE page = 'home' 
AND section = 'footer' 
AND element_key = 'footer_text_color';

-- Padronizar chaves globais
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
