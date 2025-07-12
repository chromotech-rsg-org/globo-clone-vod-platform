
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
import { useCustomizations } from '@/hooks/useCustomizations';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { getCustomization } = useCustomizations('home');

  const logoText = getCustomization('header', 'logo_text', 'Globoplay');
  const backgroundColor = getCustomization('header', 'background_color', '#111827');

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <header 
      className="backdrop-blur-sm fixed w-full top-0 z-50 border-b border-gray-800"
      style={{ backgroundColor: backgroundColor + '95' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-blue-600 text-white px-3 py-1 rounded font-bold text-xl">G</div>
            <span className="text-white font-bold text-xl">{logoText}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection('hero')}
              className="text-gray-300 hover:text-white transition-colors"
            >
              Início
            </button>
            <button 
              onClick={() => scrollToSection('content')}
              className="text-gray-300 hover:text-white transition-colors"
            >
              Conteúdo
            </button>
            <button 
              onClick={() => scrollToSection('plans')}
              className="text-gray-300 hover:text-white transition-colors"
            >
              Planos
            </button>
            <Link to="/login" className="text-gray-300 hover:text-white transition-colors">
              Entrar
            </Link>
            <Link 
              to="/checkout" 
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Assinar
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white p-2"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-gray-800 border-t border-gray-700">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <button 
                onClick={() => scrollToSection('hero')}
                className="block w-full text-left px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
              >
                Início
              </button>
              <button 
                onClick={() => scrollToSection('content')}
                className="block w-full text-left px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
              >
                Conteúdo
              </button>
              <button 
                onClick={() => scrollToSection('plans')}
                className="block w-full text-left px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
              >
                Planos
              </button>
              <Link 
                to="/login" 
                className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Entrar
              </Link>
              <Link 
                to="/checkout" 
                className="block px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Assinar
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
