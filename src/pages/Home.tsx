
import React from 'react';
import Header from '@/components/Header';
import HeroBanner from '@/components/HeroBanner';
import HeroSlider from '@/components/HeroSlider';
import ContentCarousel from '@/components/ContentCarousel';
import PlansSection from '@/components/PlansSection';
import Footer from '@/components/Footer';
import { useContentSections } from '@/hooks/useContentSections';
import { useCustomizations } from '@/hooks/useCustomizations';

const Home = () => {
  const { sections, loading } = useContentSections('home');
  const { getCustomization } = useCustomizations('home');

  const siteBgColor = getCustomization('global', 'site_background_color', '#0f172a');
  const heroSliderImages = getCustomization('hero', 'hero_slider_images', '');

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: siteBgColor }}
    >
      <Header />
      {heroSliderImages ? <HeroSlider /> : <HeroBanner />}
      
      <div id="content" className="px-4 md:px-8 space-y-12 pb-20 pt-16">
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
                age_rating_background_color: item.age_rating_background_color || '#fbbf24'
              }))}
              type={section.type}
            />
          ))
        )}
      </div>

      <PlansSection />
      <Footer />
    </div>
  );
};

export default Home;
