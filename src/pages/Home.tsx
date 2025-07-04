
import React from 'react';
import Header from '@/components/Header';
import HeroBanner from '@/components/HeroBanner';
import ContentCarousel from '@/components/ContentCarousel';
import PlansSection from '@/components/PlansSection';
import Footer from '@/components/Footer';

const Home = () => {
  const featuredContent = [
    {
      id: '1',
      title: 'The Last of Us',
      image: 'https://images.unsplash.com/photo-1489599135113-5ac34e8e2e3c?w=800&h=450&fit=crop',
      category: 'Série Original HBO',
      rating: '16'
    },
    {
      id: '2',
      title: 'House of the Dragon',
      image: 'https://images.unsplash.com/photo-1518329127034-7ed764527b8e?w=800&h=450&fit=crop',
      category: 'Série Original HBO',
      rating: '16'
    },
    {
      id: '3',
      title: 'Succession',
      image: 'https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?w=800&h=450&fit=crop',
      category: 'Série Original HBO',
      rating: '14'
    },
    {
      id: '4',
      title: 'Euphoria',
      image: 'https://images.unsplash.com/photo-1489599135113-5ac34e8e2e3c?w=800&h=450&fit=crop',
      category: 'Série Original HBO',
      rating: '18'
    },
    {
      id: '5',
      title: 'White Lotus',
      image: 'https://images.unsplash.com/photo-1518329127034-7ed764527b8e?w=800&h=450&fit=crop',
      category: 'Série Original HBO',
      rating: '16'
    }
  ];

  const novelas = [
    {
      id: '6',
      title: 'Terra e Paixão',
      image: 'https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?w=400&h=600&fit=crop',
      category: 'Novela das 9',
      rating: 'L'
    },
    {
      id: '7',
      title: 'Travessia',
      image: 'https://images.unsplash.com/photo-1489599135113-5ac34e8e2e3c?w=400&h=600&fit=crop',
      category: 'Novela das 9',
      rating: '10'
    },
    {
      id: '8',
      title: 'Vai na Fé',
      image: 'https://images.unsplash.com/photo-1518329127034-7ed764527b8e?w=400&h=600&fit=crop',
      category: 'Novela das 7',
      rating: 'L'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <HeroBanner />
      
      <div id="content" className="px-4 md:px-8 space-y-12 pb-20 pt-16">
        <ContentCarousel 
          title="Em alta" 
          items={featuredContent}
          type="horizontal"
        />
        
        <ContentCarousel 
          title="Novelas" 
          items={novelas}
          type="vertical"
        />
        
        <ContentCarousel 
          title="Séries Originais HBO" 
          items={featuredContent}
          type="horizontal"
        />
        
        <ContentCarousel 
          title="Filmes em Destaque" 
          items={featuredContent}
          type="horizontal"
        />
      </div>

      <PlansSection />
      <Footer />
    </div>
  );
};

export default Home;
