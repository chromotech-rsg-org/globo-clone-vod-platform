
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  image: string;
  category: string;
  rating: string;
  age_rating_background_color?: string;
  image_orientation?: string;
}

interface ContentCarouselProps {
  title: string;
  items: ContentItem[];
  type: 'horizontal' | 'vertical';
}

const ContentCarousel = ({ title, items, type }: ContentCarouselProps) => {
  const scrollLeft = (containerId: string) => {
    const container = document.getElementById(containerId);
    if (container) {
      container.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = (containerId: string) => {
    const container = document.getElementById(containerId);
    if (container) {
      container.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const containerId = `carousel-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="relative">
      <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>
      
      <div className="relative group">
        {/* Navigation buttons */}
        <button
          onClick={() => scrollLeft(containerId)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-r-md opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        
        <button
          onClick={() => scrollRight(containerId)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-l-md opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Content container */}
        <div
          id={containerId}
          className="flex space-x-4 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((item) => {
            // Determinar orientação: usar image_orientation do item ou o type da seção
            const isVertical = item.image_orientation === 'vertical' || (item.image_orientation !== 'horizontal' && type === 'vertical');
            
            return (
              <div
                key={item.id}
                className={`flex-none group cursor-pointer ${
                  isVertical ? 'w-48' : 'w-80'
                }`}
              >
                <div className="relative overflow-hidden rounded-lg">
                  <img
                    src={item.image}
                    alt={item.title}
                    className={`w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                      isVertical ? 'h-72' : 'h-44'
                    }`}
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-300">{item.category}</span>
                        <span 
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            item.age_rating_background_color === '#000000' ? 'text-white' : 'text-black'
                          }`}
                          style={{ backgroundColor: item.age_rating_background_color || '#eab308' }}
                        >
                          {item.rating}
                        </span>
                      </div>
                      <h3 className="text-white font-semibold text-sm line-clamp-2">
                        {item.title}
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ContentCarousel;
