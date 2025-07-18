-- Criar política para permitir admins criarem, editarem e excluírem usuários
CREATE POLICY "Admins can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (get_current_user_role() = ANY (ARRAY['admin'::text, 'desenvolvedor'::text]));

CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (
  (auth.uid() = id) OR 
  (get_current_user_role() = ANY (ARRAY['admin'::text, 'desenvolvedor'::text]))
);

CREATE POLICY "Admins can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'desenvolvedor'::text]));

-- Limpar dados duplicados de slider hero e padronizar chaves
DELETE FROM public.customizations 
WHERE page = 'home' 
AND section = 'hero' 
AND element_key LIKE 'hero_hero_%';

-- Padronizar chaves do slider hero
UPDATE public.customizations 
SET element_key = 'hero_slider_images'
WHERE page = 'home' 
AND section = 'hero' 
AND element_key = 'hero_slider_images';

UPDATE public.customizations 
SET element_key = 'hero_slider_autoplay_duration'
WHERE page = 'home' 
AND section = 'hero' 
AND element_key = 'hero_slider_autoplay_duration';