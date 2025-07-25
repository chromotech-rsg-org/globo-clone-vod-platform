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
  const [isLoaded, setIsLoaded] = useState(false);
  const { getCustomization, refetch, loading } = useCustomizations('home');

  useEffect(() => {
    if (loading) return;
    
    console.log('🔄 Loading hero slider data...');
    
    // Load existing slides using correct keys
    const slideImages = getCustomization('hero', 'hero_slider_images', '');
    const duration = getCustomization('hero', 'hero_slider_autoplay_duration', '5000');
    
    console.log('📊 Loaded data:', { slideImages, duration });
    
    // Set duration with validation
    const validDuration = duration && duration.trim() !== '' ? duration : '5000';
    setAutoplayDuration(validDuration);
    
    // Parse and set slides
    if (slideImages && slideImages.trim() !== '' && slideImages !== '[]') {
      try {
        const parsedSlides = JSON.parse(slideImages);
        console.log('📋 Parsed slides:', parsedSlides);
        
        if (Array.isArray(parsedSlides) && parsedSlides.length > 0) {
          // Ensure each slide has all required properties
          const validSlides = parsedSlides.map(slide => ({
            id: slide.id || Date.now().toString(),
            image: slide.image || '',
            title: slide.title || 'Novo Slide',
            subtitle: slide.subtitle || 'Subtítulo',
            description: slide.description || 'Descrição...',
            buttonText: slide.buttonText || 'Assistir'
          }));
          setSlides(validSlides);
        } else {
          console.log('📋 No valid slides found, using default');
          setSlides([defaultSlide]);
        }
      } catch (error) {
        console.error('❌ Error parsing slider images:', error);
        setSlides([defaultSlide]);
      }
    } else {
      console.log('📋 No slide data found, using default');
      setSlides([defaultSlide]);
    }
    
    setIsLoaded(true);
  }, [getCustomization, loading]);

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

  const addSlide = async () => {
    const newSlide: HeroSlide = {
      id: Date.now().toString(),
      image: '',
      title: 'Novo Slide',
      subtitle: 'Subtítulo',
      description: 'Descrição do novo slide...',
      buttonText: 'Assistir'
    };
    
    const updatedSlides = [...slides, newSlide];
    setSlides(updatedSlides);
    
    // Auto-save when adding new slide
    console.log('💾 Auto-saving new slide...');
    try {
      const result = await saveCustomization(
        'hero_slider_images', 
        JSON.stringify(updatedSlides), 
        'hero', 
        'text'
      );
      
      if (result.success) {
        console.log('✅ New slide saved successfully');
        await refetch();
      } else {
        console.error('❌ Failed to save new slide:', result.error);
      }
    } catch (error) {
      console.error('❌ Error saving new slide:', error);
    }
  };

  const removeSlide = async (slideId: string) => {
    if (slides.length > 1) {
      const updatedSlides = slides.filter(slide => slide.id !== slideId);
      setSlides(updatedSlides);
      
      // Auto-save after removing slide
      console.log('💾 Auto-saving after slide removal...');
      try {
        const result = await saveCustomization(
          'hero_slider_images', 
          JSON.stringify(updatedSlides), 
          'hero', 
          'text'
        );
        
        if (result.success) {
          console.log('✅ Slide removal saved successfully');
          await refetch();
        } else {
          console.error('❌ Failed to save slide removal:', result.error);
        }
      } catch (error) {
        console.error('❌ Error saving slide removal:', error);
      }
    }
  };

  const updateSlide = (slideId: string, field: keyof HeroSlide, value: string) => {
    console.log('🔄 Updating slide:', { slideId, field, value });
    setSlides(prev => prev.map(slide => 
      slide.id === slideId ? { ...slide, [field]: value } : slide
    ));
  };

  const saveSlide = async (slideId: string) => {
    setSaving(true);
    try {
      const result = await saveCustomization(
        'hero_slider_images', 
        JSON.stringify(slides), 
        'hero', 
        'text'
      );

      if (result.success) {
        return { success: true };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error saving slide:', error);
      return { success: false, error: 'Erro ao salvar slide' };
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const durationResult = await saveCustomization(
        'hero_slider_autoplay_duration',
        autoplayDuration,
        'hero',
        'text'
      );

      if (durationResult.success) {
        return { success: true };
      } else {
        throw new Error(durationResult.error);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      return { success: false, error: 'Erro ao salvar configurações' };
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
    saveSlide,
    saveSettings,
    saving,
    isLoaded
  };
};