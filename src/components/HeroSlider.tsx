import React, { useState, useEffect, useMemo } from 'react';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCustomizations } from '@/hooks/useCustomizations';

interface HeroSlide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  titleColor: string;
  buttonBackgroundColor: string;
  buttonTextColor: string;
}

const defaultSlide: HeroSlide = {
  id: '1',
  image: 'https://images.unsplash.com/photo-1489599135113-5ac34e8e2e3c?w=1920&h=1080&fit=crop',
  title: 'The Last of Us',
  subtitle: 'SÉRIE ORIGINAL HBO',
  description: 'Em um futuro pós-apocalíptico, Joel e Ellie precisam sobreviver em um mundo devastado por uma infecção que transforma humanos em criaturas.',
  buttonText: 'Assistir',
  titleColor: '#ffffff',
  buttonBackgroundColor: '#ffffff',
  buttonTextColor: '#000000'
};

const HeroSlider = () => {
  const { getCustomization, loading } = useCustomizations('home');
  const [currentSlide, setCurrentSlide] = useState(0);

  // Get slider configuration - sem memoização para evitar loops infinitos
  const slideImages = getCustomization('hero', 'hero_slider_images', '');
  const autoplayDuration = parseInt(getCustomization('hero', 'hero_slider_autoplay_duration', '5000'));

  // Parse slides from customizations
  const slides = useMemo(() => {
    // Don't process slides if still loading
    if (loading) {
      return [];
    }
    
    console.log('🔄 HeroSlider: Processing slide images:', slideImages);
    
    if (slideImages && slideImages.trim() !== '' && slideImages !== '[]') {
      try {
        const parsedSlides = JSON.parse(slideImages);
        console.log('📋 HeroSlider: Parsed slides:', parsedSlides);
        
        if (Array.isArray(parsedSlides) && parsedSlides.length > 0) {
          // Ensure each slide has valid properties
          const validSlides = parsedSlides.map(slide => ({
            id: slide.id || Date.now().toString(),
            image: slide.image || '',
            title: slide.title || 'Slide',
            subtitle: slide.subtitle || '',
            description: slide.description || '',
            buttonText: slide.buttonText || 'Assistir',
            titleColor: slide.titleColor || '#ffffff',
            buttonBackgroundColor: slide.buttonBackgroundColor || '#ffffff',
            buttonTextColor: slide.buttonTextColor || '#000000'
          }));
          
          console.log('✅ HeroSlider: Using', validSlides.length, 'slides');
          return validSlides;
        }
      } catch (error) {
        console.error('❌ HeroSlider: Error parsing slider images:', error);
      }
    }
    
    // Only return default slide if customizations are loaded and no slides found
    console.log('📋 HeroSlider: Using default slide');
    return [defaultSlide];
  }, [slideImages, loading]);

  // Auto-advance slides
  useEffect(() => {
    if (slides.length > 1 && autoplayDuration > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, autoplayDuration);

      return () => clearInterval(interval);
    }
  }, [slides.length, autoplayDuration]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Don't show default content while loading customizations
  if (loading) {
    return (
      <div className="relative h-[70vh] bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  if (slides.length === 0) return null;

  const currentSlideData = slides[currentSlide];

  return (
    <div id="hero" className="relative h-[70vh] bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(17, 24, 39, 0.8), rgba(17, 24, 39, 0.4)), url('${currentSlideData.image}')`
        }}
      />
      
      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            <div className="mb-4">
              <span className="bg-red-600 text-white px-3 py-1 rounded text-sm font-medium">
                {currentSlideData.subtitle}
              </span>
            </div>
            
            <h1 
              className="text-4xl md:text-6xl font-bold mb-4 transition-all duration-500"
              style={{ color: currentSlideData.titleColor }}
            >
              {currentSlideData.title}
            </h1>
            
            <p className="text-lg text-gray-300 mb-8 leading-relaxed transition-all duration-500">
              {currentSlideData.description}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href="/#plans"
                className="px-8 py-3 rounded-md font-semibold flex items-center justify-center space-x-2 hover:opacity-90 transition-colors"
                style={{ 
                  backgroundColor: currentSlideData.buttonBackgroundColor,
                  color: currentSlideData.buttonTextColor
                }}
              >
                <Play className="h-5 w-5 fill-current" />
                <span>{currentSlideData.buttonText}</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroSlider;