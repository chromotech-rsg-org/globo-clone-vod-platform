
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteTitle } from '@/hooks/useSiteTitle';
import { useSiteCustomizations } from '@/hooks/useSiteCustomizations';
import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck';
import { useContentSections } from '@/hooks/useContentSections';
import Header from '@/components/Header';
import HeroBanner from '@/components/HeroBanner';
import HeroSlider from '@/components/HeroSlider';
import PlansSection from '@/components/PlansSection';
import ContentCarousel from '@/components/ContentCarousel';
import Footer from '@/components/Footer';
import UserHeader from '@/components/UserHeader';
import SubscriptionRequiredModal from '@/components/SubscriptionRequiredModal';
import { Navigate } from 'react-router-dom';

const Index = () => {
  const { user } = useAuth();
  const { siteName, streamingUrl, loading: siteLoading } = useSiteCustomizations();
  const { hasActiveSubscription, loading: subscriptionLoading } = useSubscriptionCheck();
  const { sections, loading: contentLoading } = useContentSections('homepage');
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  
  // Use the site title hook to update document title
  useSiteTitle();

  // If user is authenticated and has active subscription, show the streaming content
  if (user && hasActiveSubscription && streamingUrl) {
    return (
      <div className="min-h-screen bg-gray-900">
        <UserHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <iframe
              src={streamingUrl}
              className="w-full h-full"
              allowFullScreen
              title={`${siteName} - Streaming`}
            />
          </div>
        </div>
      </div>
    );
  }

  // If user is authenticated but doesn't have subscription, redirect to dashboard
  if (user && !subscriptionLoading && hasActiveSubscription === false) {
    return <Navigate to="/dashboard" replace />;
  }

  // Public homepage for non-authenticated users or during loading
  return (
    <div className="min-h-screen bg-background">
      {user && <UserHeader />}
      <Header />
      
      {/* Hero Section */}
      <HeroSlider />
      <HeroBanner />
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-12">
        <PlansSection />
        
        {/* Content Sections */}
        {!contentLoading && sections.map((section) => (
          <ContentCarousel
            key={section.id}
            title={section.title}
            items={section.items.map(item => ({
              id: item.id,
              title: item.title,
              image: item.image_url || '/placeholder.svg',
              category: item.category || 'Geral',
              rating: item.rating || 'L',
              age_rating_background_color: item.age_rating_background_color || '#fbbf24'
            }))}
            type={section.type}
          />
        ))}
      </main>
      
      <Footer />
      
      {/* Subscription Required Modal for authenticated users without subscription */}
      {user && hasActiveSubscription === false && (
        <SubscriptionRequiredModal 
          open={subscriptionModalOpen}
          onClose={() => setSubscriptionModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Index;
