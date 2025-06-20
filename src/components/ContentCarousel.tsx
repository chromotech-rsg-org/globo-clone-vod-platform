
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  image: string;
  category: string;
  rating: string;
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
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex-none group cursor-pointer ${
                type === 'horizontal' ? 'w-80' : 'w-48'
              }`}
            >
              <div className="relative overflow-hidden rounded-lg">
                <img
                  src={item.image}
                  alt={item.title}
                  className={`w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                    type === 'horizontal' ? 'h-44' : 'h-72'
                  }`}
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-300">{item.category}</span>
                      <span className="bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
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
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContentCarousel;
