
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import HeroBanner from '@/components/HeroBanner';
import HeroSlider from '@/components/HeroSlider';
import ContentCarousel from '@/components/ContentCarousel';
import PlansSection from '@/components/PlansSection';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';
import AuctionPromoBanner from '@/components/auction/AuctionPromoBanner';
import { useContentSections } from '@/hooks/useContentSections';
import { useCustomizations } from '@/hooks/useCustomizations';

const Home = () => {
  const { sections, loading } = useContentSections('home');
  const { getCustomization, loading: customizationsLoading } = useCustomizations('home');
  const location = useLocation();

  // Scroll suave para âncora após carregamento
  useEffect(() => {
    if (!customizationsLoading && !loading && location.hash) {
      const elementId = location.hash.replace('#', '');
      
      // Tentar encontrar o elemento com retry
      const scrollToElement = (attempts = 0) => {
        const element = document.getElementById(elementId);
        
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start' 
            });
          }, 200);
        } else if (attempts < 5) {
          // Tentar novamente após 200ms se o elemento não existir ainda
          setTimeout(() => scrollToElement(attempts + 1), 200);
        }
      };
      
      scrollToElement();
    }
  }, [location.hash, customizationsLoading, loading]);

  const siteBgColor = getCustomization('global', 'site_background_color', '#0f172a');
  const heroSliderImages = getCustomization('hero', 'hero_slider_images', '');
  const contentBgColor = getCustomization('header', 'content_background_color', 'transparent');

  // Show loading while customizations are being fetched
  if (customizationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl text-white">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: siteBgColor }}
    >
      <Header />
      {!customizationsLoading && (
        heroSliderImages && heroSliderImages.trim() !== '' && heroSliderImages !== '[]' ? <HeroSlider /> : <HeroBanner />
      )}
      
      <div 
        id="content" 
        className="px-4 md:px-8 space-y-12 pb-20 pt-16"
        style={{ backgroundColor: contentBgColor }}
      >
        <AuctionPromoBanner />
        
        {loading ? (
          <div className="text-center text-white">Carregando conteúdo...</div>
        ) : (
          sections.map((section) => (
            <ContentCarousel 
              key={section.id}
              title={section.title}
              items={section.items.map(item => ({
                id: item.id,
                title: item.title,
                image: item.image_url || '',
                category: item.category || '',
                rating: item.rating || '',
                age_rating_background_color: (item as any).age_rating_background_color || '#fbbf24'
              }))}
              type={section.type}
            />
          ))
        )}
      </div>

      <PlansSection />
      <Footer />
      <BackToTop />
    </div>
  );
};

export default Home;
