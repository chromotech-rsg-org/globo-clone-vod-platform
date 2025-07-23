
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
import { useCustomizations } from '@/hooks/useCustomizations';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { getCustomization } = useCustomizations('home');

  const logoImage = getCustomization('header', 'header_logo_image', '');
  const siteName = getCustomization('global', 'global_site_name', 'Globoplay');
  const headerBgColor = getCustomization('header', 'header_background_color', 'transparent');
  const headerTextColor = getCustomization('header', 'header_text_color', '#ffffff');
  const headerHoverColor = getCustomization('header', 'header_hover_color', '#ef4444');
  
  // Menu titles
  const menuHome = getCustomization('header', 'header_menu_home', 'Início');
  const menuContent = getCustomization('header', 'header_menu_content', 'Conteúdo');
  const menuPlans = getCustomization('header', 'header_menu_plans', 'Planos');
  const menuLogin = getCustomization('header', 'header_menu_login', 'Entrar');

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
      style={{ backgroundColor: headerBgColor === 'transparent' ? 'rgba(0,0,0,0.8)' : headerBgColor }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            {logoImage ? (
              <img src={logoImage} alt={siteName} className="h-8 w-auto" />
            ) : (
              <div className="bg-blue-600 text-white px-3 py-1 rounded font-bold text-xl">G</div>
            )}
            <span className="font-bold text-xl" style={{ color: headerTextColor }}>{siteName}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection('hero')}
              className="hover:transition-colors" 
              style={{ 
                color: headerTextColor,
                '--hover-color': headerHoverColor
              } as React.CSSProperties}
              onMouseEnter={(e) => e.currentTarget.style.color = headerHoverColor}
              onMouseLeave={(e) => e.currentTarget.style.color = headerTextColor}
            >
              {menuHome}
            </button>
            <button 
              onClick={() => scrollToSection('content')}
              className="hover:transition-colors"
              style={{ 
                color: headerTextColor,
                '--hover-color': headerHoverColor
              } as React.CSSProperties}
              onMouseEnter={(e) => e.currentTarget.style.color = headerHoverColor}
              onMouseLeave={(e) => e.currentTarget.style.color = headerTextColor}
            >
              {menuContent}
            </button>
            <button 
              onClick={() => scrollToSection('plans')}
              className="hover:transition-colors"
              style={{ 
                color: headerTextColor,
                '--hover-color': headerHoverColor
              } as React.CSSProperties}
              onMouseEnter={(e) => e.currentTarget.style.color = headerHoverColor}
              onMouseLeave={(e) => e.currentTarget.style.color = headerTextColor}
            >
              {menuPlans}
            </button>
            <Link 
              to="/login" 
              className="hover:opacity-90 transition-opacity px-4 py-2 rounded-md"
              style={{ 
                backgroundColor: headerHoverColor,
                color: '#ffffff'
              }}
            >
              {menuLogin}
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2"
            style={{ color: headerTextColor }}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t" style={{ backgroundColor: headerBgColor === 'transparent' ? 'rgba(0,0,0,0.9)' : headerBgColor, borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="px-2 pt-2 pb-3 space-y-1">
              <button 
                onClick={() => scrollToSection('hero')}
                className="block w-full text-left px-3 py-2 rounded-md transition-colors"
                style={{ 
                  color: headerTextColor,
                  '--hover-color': headerHoverColor
                } as React.CSSProperties}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {menuHome}
              </button>
              <button 
                onClick={() => scrollToSection('content')}
                className="block w-full text-left px-3 py-2 rounded-md transition-colors"
                style={{ 
                  color: headerTextColor,
                  '--hover-color': headerHoverColor
                } as React.CSSProperties}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {menuContent}
              </button>
              <button 
                onClick={() => scrollToSection('plans')}
                className="block w-full text-left px-3 py-2 rounded-md transition-colors"
                style={{ 
                  color: headerTextColor,
                  '--hover-color': headerHoverColor
                } as React.CSSProperties}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {menuPlans}
              </button>
              <Link 
                to="/login" 
                className="block hover:opacity-90 transition-opacity px-4 py-2 rounded-md mt-4"
                style={{ 
                  backgroundColor: headerHoverColor,
                  color: '#ffffff'
                }}
                onClick={() => setIsMenuOpen(false)}
              >
                {menuLogin}
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
