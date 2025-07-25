-- Fix the autoplay duration value
UPDATE customizations 
SET element_value = '5000' 
WHERE page = 'home' 
  AND section = 'hero' 
  AND element_key = 'hero_slider_autoplay_duration' 
  AND (element_value IS NULL OR element_value = '');