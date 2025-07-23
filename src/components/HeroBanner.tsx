
import React from 'react';
import { Play } from 'lucide-react';
import { useCustomizations } from '@/hooks/useCustomizations';

const HeroBanner = () => {
  const { getCustomization } = useCustomizations('home');

  const backgroundImage = getCustomization('hero', 'background_image', 'https://images.unsplash.com/photo-1489599135113-5ac34e8e2e3c?w=1920&h=1080&fit=crop');
  const title = getCustomization('hero', 'title', 'The Last of Us');
  const subtitle = getCustomization('hero', 'subtitle', 'SÉRIE ORIGINAL HBO');
  const description = getCustomization('hero', 'description', 'Em um futuro pós-apocalíptico, Joel e Ellie precisam sobreviver em um mundo devastado por uma infecção que transforma humanos em criaturas.');
  const buttonText = getCustomization('hero', 'button_text', 'Assistir');
  const titleColor = getCustomization('hero', 'title_color', '#ffffff');
  const buttonBackgroundColor = getCustomization('hero', 'button_background_color', '#ffffff');
  const buttonTextColor = getCustomization('hero', 'button_text_color', '#000000');

  return (
    <div id="hero" className="relative h-[70vh] bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(17, 24, 39, 0.8), rgba(17, 24, 39, 0.4)), url('${backgroundImage}')`
        }}
      />
      
      <div className="absolute inset-0 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            <div className="mb-4">
              <span className="bg-red-600 text-white px-3 py-1 rounded text-sm font-medium">
                {subtitle}
              </span>
            </div>
            
            <h1 
              className="text-4xl md:text-6xl font-bold mb-4"
              style={{ color: titleColor }}
            >
              {title}
            </h1>
            
            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              {description}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                className="px-8 py-3 rounded-md font-semibold flex items-center justify-center space-x-2 hover:opacity-90 transition-colors"
                style={{ 
                  backgroundColor: buttonBackgroundColor,
                  color: buttonTextColor
                }}
              >
                <Play className="h-5 w-5 fill-current" />
                <span>{buttonText}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
