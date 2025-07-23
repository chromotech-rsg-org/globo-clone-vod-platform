import { useState, useEffect } from 'react';
import { useCustomizations } from '@/hooks/useCustomizations';
import { supabase } from '@/integrations/supabase/client';

interface HeroSlide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
}

const defaultSlide: HeroSlide = {
  id: '1',
  image: 'https://images.unsplash.com/photo-1489599135113-5ac34e8e2e3c?w=1920&h=1080&fit=crop',
  title: 'The Last of Us',
  subtitle: 'SÉRIE ORIGINAL HBO',
  description: 'Em um futuro pós-apocalíptico, Joel e Ellie precisam sobreviver em um mundo devastado por uma infecção que transforma humanos em criaturas.',
  buttonText: 'Assistir'
};

export const useHeroSlider = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([defaultSlide]);
  const [autoplayDuration, setAutoplayDuration] = useState('5000');
  const [saving, setSaving] = useState(false);
  const { getCustomization, refetch } = useCustomizations('home');

  useEffect(() => {
    // Load existing slides
    const slideImages = getCustomization('hero', 'slider_images', '');
    const duration = getCustomization('hero', 'slider_autoplay_duration', '5000');
    
    setAutoplayDuration(duration);
    
    if (slideImages) {
      try {
        const parsedSlides = JSON.parse(slideImages);
        if (Array.isArray(parsedSlides) && parsedSlides.length > 0) {
          setSlides(parsedSlides);
        }
      } catch (error) {
        console.error('Error parsing slider images:', error);
        setSlides([defaultSlide]);
      }
    }
  }, [getCustomization]);

  const saveCustomization = async (key: string, value: string, section: string, elementType: string) => {
    try {
      const { error } = await supabase
        .from('customizations')
        .upsert({
          page: 'home',
          section: section,
          element_type: elementType,
          element_key: key,
          element_value: value,
          active: true
        }, {
          onConflict: 'page,section,element_key'
        });

      if (error) throw error;
      
      await refetch();
      return { success: true };
    } catch (error) {
      console.error('Erro ao salvar:', error);
      return { success: false, error: 'Erro ao salvar personalização' };
    }
  };

  const addSlide = () => {
    const newSlide: HeroSlide = {
      id: Date.now().toString(),
      image: '',
      title: 'Novo Slide',
      subtitle: 'Subtítulo',
      description: 'Descrição do novo slide...',
      buttonText: 'Assistir'
    };
    setSlides(prev => [...prev, newSlide]);
  };

  const removeSlide = (slideId: string) => {
    if (slides.length > 1) {
      setSlides(prev => prev.filter(slide => slide.id !== slideId));
    }
  };

  const updateSlide = (slideId: string, field: keyof HeroSlide, value: string) => {
    setSlides(prev => prev.map(slide => 
      slide.id === slideId ? { ...slide, [field]: value } : slide
    ));
  };

  const saveSlides = async () => {
    setSaving(true);
    try {
      const slidesResult = await saveCustomization(
        'slider_images', 
        JSON.stringify(slides), 
        'hero', 
        'text'
      );

      const durationResult = await saveCustomization(
        'slider_autoplay_duration',
        autoplayDuration,
        'hero',
        'text'
      );

      if (slidesResult.success && durationResult.success) {
        return { success: true };
      } else {
        throw new Error(slidesResult.error || durationResult.error);
      }
    } catch (error) {
      console.error('Error saving slider settings:', error);
      return { success: false, error: 'Erro ao salvar slider' };
    } finally {
      setSaving(false);
    }
  };

  return {
    slides,
    autoplayDuration,
    setAutoplayDuration,
    addSlide,
    removeSlide,
    updateSlide,
    saveSlides,
    saving
  };
};