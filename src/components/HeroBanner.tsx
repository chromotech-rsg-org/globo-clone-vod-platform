
import React from 'react';
import { Play } from 'lucide-react';

const HeroBanner = () => {
  return (
    <div className="relative h-[70vh] bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(17, 24, 39, 0.8), rgba(17, 24, 39, 0.4)), url('https://images.unsplash.com/photo-1489599135113-5ac34e8e2e3c?w=1920&h=1080&fit=crop')`
        }}
      />
      
      <div className="absolute inset-0 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            <div className="mb-4">
              <span className="bg-red-600 text-white px-3 py-1 rounded text-sm font-medium">
                SÉRIE ORIGINAL HBO
              </span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              The Last of Us
            </h1>
            
            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              Em um futuro pós-apocalíptico, Joel e Ellie precisam sobreviver em um mundo 
              devastado por uma infecção que transforma humanos em criaturas.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-white text-black px-8 py-3 rounded-md font-semibold flex items-center justify-center space-x-2 hover:bg-gray-100 transition-colors">
                <Play className="h-5 w-5 fill-current" />
                <span>Assistir</span>
              </button>
              
              <button className="bg-gray-700/80 text-white px-8 py-3 rounded-md font-semibold hover:bg-gray-600 transition-colors">
                Mais Informações
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
