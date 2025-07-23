
-- Padronizar chaves do footer (remover duplicações)
UPDATE public.customizations 
SET element_key = 'footer_background_color'
WHERE page = 'home' 
AND section = 'footer' 
AND element_key = 'footer_footer_background_color';

UPDATE public.customizations 
SET element_key = 'footer_text_color'
WHERE page = 'home' 
AND section = 'footer' 
AND element_key = 'footer_footer_text_color';

UPDATE public.customizations 
SET element_key = 'footer_copyright'
WHERE page = 'home' 
AND section = 'footer' 
AND element_key = 'footer_footer_copyright';

UPDATE public.customizations 
SET element_key = 'footer_logo_image'
WHERE page = 'home' 
AND section = 'footer' 
AND element_key = 'footer_footer_logo_image';

-- Garantir que as chaves do header estejam corretas
UPDATE public.customizations 
SET element_key = 'header_logo_image'
WHERE page = 'home' 
AND section = 'header' 
AND element_key LIKE '%logo%';

UPDATE public.customizations 
SET element_key = 'header_background_color'
WHERE page = 'home' 
AND section = 'header' 
AND element_key LIKE '%background%';

UPDATE public.customizations 
SET element_key = 'header_text_color'
WHERE page = 'home' 
AND section = 'header' 
AND element_key LIKE '%text_color%';

UPDATE public.customizations 
SET element_key = 'header_hover_color'
WHERE page = 'home' 
AND section = 'header' 
AND element_key LIKE '%hover%';

-- Criar chaves necessárias para o slider se não existirem
INSERT INTO public.customizations (page, section, element_type, element_key, element_value, active)
VALUES ('home', 'hero', 'text', 'slider_images', '[]', true)
ON CONFLICT (page, section, element_key) DO NOTHING;

INSERT INTO public.customizations (page, section, element_type, element_key, element_value, active)
VALUES ('home', 'hero', 'text', 'slider_autoplay_duration', '5000', true)
ON CONFLICT (page, section, element_key) DO NOTHING;

-- Criar chaves necessárias para os planos se não existirem
INSERT INTO public.customizations (page, section, element_type, element_key, element_value, active)
VALUES ('home', 'plans', 'color', 'plans_background_color', '#1f2937', true)
ON CONFLICT (page, section, element_key) DO NOTHING;

INSERT INTO public.customizations (page, section, element_type, element_key, element_value, active)
VALUES ('home', 'plans', 'color', 'plans_border_color', '#3b82f6', true)
ON CONFLICT (page, section, element_key) DO NOTHING;

INSERT INTO public.customizations (page, section, element_type, element_key, element_value, active)
VALUES ('home', 'plans', 'color', 'plans_badge_background', '#3b82f6', true)
ON CONFLICT (page, section, element_key) DO NOTHING;

INSERT INTO public.customizations (page, section, element_type, element_key, element_value, active)
VALUES ('home', 'plans', 'color', 'plans_badge_text_color', '#ffffff', true)
ON CONFLICT (page, section, element_key) DO NOTHING;

INSERT INTO public.customizations (page, section, element_type, element_key, element_value, active)
VALUES ('home', 'plans', 'text', 'plans_badge_text', 'Mais Popular', true)
ON CONFLICT (page, section, element_key) DO NOTHING;
