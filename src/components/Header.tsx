
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, User, LogOut, Home, BarChart3, Calendar, Gavel } from 'lucide-react';
import { useCustomizations } from '@/hooks/useCustomizations';
import { useAuth } from '@/contexts/AuthContext';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { getCustomization, loading } = useCustomizations('home');
  const { user, logout } = useAuth();

  // Don't show default values while loading
  if (loading) {
    return (
      <header className="backdrop-blur-sm w-full top-0 z-50 border-b border-gray-800 relative bg-black/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="h-8 w-8 bg-gray-700 rounded animate-pulse"></div>
            <div className="hidden md:flex space-x-8">
              <div className="h-4 w-12 bg-gray-700 rounded animate-pulse"></div>
              <div className="h-4 w-16 bg-gray-700 rounded animate-pulse"></div>
              <div className="h-4 w-12 bg-gray-700 rounded animate-pulse"></div>
              <div className="h-4 w-16 bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

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

  // Custom button configurations
  const customButtonText = getCustomization('header', 'custom_button_text', '');
  const customButtonBgColor = getCustomization('header', 'custom_button_bg_color', '#3b82f6');
  const customButtonTextColor = getCustomization('header', 'custom_button_text_color', '#ffffff');
  const customButtonIcon = getCustomization('header', 'custom_button_icon', '');
  const customButtonLink = getCustomization('header', 'custom_button_link', '');

  const handleCustomButtonClick = () => {
    if (customButtonLink) {
      window.open(customButtonLink, '_blank');
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
  };

  return (
    <header 
      className="backdrop-blur-sm w-full top-0 z-50 border-b border-gray-800 relative"
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
              className="hover:transition-colors flex items-center space-x-2" 
              style={{ 
                color: headerTextColor,
                '--hover-color': headerHoverColor
              } as React.CSSProperties}
              onMouseEnter={(e) => e.currentTarget.style.color = headerHoverColor}
              onMouseLeave={(e) => e.currentTarget.style.color = headerTextColor}
            >
              <Home className="h-4 w-4" />
              <span>{menuHome}</span>
            </button>
            <button 
              onClick={() => scrollToSection('content')}
              className="hover:transition-colors flex items-center space-x-2"
              style={{ 
                color: headerTextColor,
                '--hover-color': headerHoverColor
              } as React.CSSProperties}
              onMouseEnter={(e) => e.currentTarget.style.color = headerHoverColor}
              onMouseLeave={(e) => e.currentTarget.style.color = headerTextColor}
            >
              <Calendar className="h-4 w-4" />
              <span>{menuContent}</span>
            </button>
            <button 
              onClick={() => scrollToSection('plans')}
              className="hover:transition-colors flex items-center space-x-2"
              style={{ 
                color: headerTextColor,
                '--hover-color': headerHoverColor
              } as React.CSSProperties}
              onMouseEnter={(e) => e.currentTarget.style.color = headerHoverColor}
              onMouseLeave={(e) => e.currentTarget.style.color = headerTextColor}
            >
              <BarChart3 className="h-4 w-4" />
              <span>{menuPlans}</span>
            </button>
            <Link 
              to="/auctions"
              className="hover:transition-colors flex items-center space-x-2"
              style={{ 
                color: headerTextColor,
                '--hover-color': headerHoverColor
              } as React.CSSProperties}
              onMouseEnter={(e) => e.currentTarget.style.color = headerHoverColor}
              onMouseLeave={(e) => e.currentTarget.style.color = headerTextColor}
            >
              <Gavel className="h-4 w-4" />
              <span>Leilões</span>
            </Link>
            {customButtonText && (
              <button
                onClick={handleCustomButtonClick}
                className="hover:opacity-90 transition-opacity px-4 py-2 rounded-md flex items-center space-x-2"
                style={{ 
                  backgroundColor: customButtonBgColor,
                  color: customButtonTextColor
                }}
              >
                <span>{customButtonText}</span>
                {customButtonIcon && (
                  <img src={customButtonIcon} alt="" className="h-4 w-4" />
                )}
              </button>
            )}
            
            {/* User Authentication Section */}
            {user ? (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/dashboard" 
                  className="hover:opacity-90 transition-opacity px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
                  style={{ color: headerTextColor }}
                  onMouseEnter={(e) => e.currentTarget.style.color = headerHoverColor}
                  onMouseLeave={(e) => e.currentTarget.style.color = headerTextColor}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <div className="flex items-center space-x-2">
                  <Link 
                    to="/profile"
                    className="text-sm hover:opacity-90 transition-opacity" 
                    style={{ color: headerTextColor }}
                    onMouseEnter={(e) => e.currentTarget.style.color = headerHoverColor}
                    onMouseLeave={(e) => e.currentTarget.style.color = headerTextColor}
                  >
                    Olá, {user.name || user.email}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="hover:opacity-90 transition-opacity px-2 py-1 rounded-md flex items-center space-x-1"
                    style={{ color: headerTextColor }}
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm">Sair</span>
                  </button>
                </div>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="hover:opacity-90 transition-opacity px-4 py-2 rounded-md flex items-center"
                style={{ 
                  backgroundColor: headerHoverColor,
                  color: '#ffffff'
                }}
              >
                <User className="h-4 w-4 mr-2" />
                {menuLogin}
              </Link>
            )}
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
                className="block w-full text-left px-3 py-2 rounded-md transition-colors flex items-center space-x-2"
                style={{ 
                  color: headerTextColor,
                  '--hover-color': headerHoverColor
                } as React.CSSProperties}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Home className="h-4 w-4" />
                <span>{menuHome}</span>
              </button>
              <button 
                onClick={() => scrollToSection('content')}
                className="block w-full text-left px-3 py-2 rounded-md transition-colors flex items-center space-x-2"
                style={{ 
                  color: headerTextColor,
                  '--hover-color': headerHoverColor
                } as React.CSSProperties}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Calendar className="h-4 w-4" />
                <span>{menuContent}</span>
              </button>
              <button 
                onClick={() => scrollToSection('plans')}
                className="block w-full text-left px-3 py-2 rounded-md transition-colors flex items-center space-x-2"
                style={{ 
                  color: headerTextColor,
                  '--hover-color': headerHoverColor
                } as React.CSSProperties}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <BarChart3 className="h-4 w-4" />
                <span>{menuPlans}</span>
              </button>
              <Link 
                to="/auctions"
                className="block w-full text-left px-3 py-2 rounded-md transition-colors flex items-center space-x-2"
                style={{ 
                  color: headerTextColor,
                  '--hover-color': headerHoverColor
                } as React.CSSProperties}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                onClick={() => setIsMenuOpen(false)}
              >
                <Gavel className="h-4 w-4" />
                <span>Leilões</span>
              </Link>
              {customButtonText && (
                <button
                  onClick={() => {
                    handleCustomButtonClick();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left hover:opacity-90 transition-opacity px-4 py-2 rounded-md mt-4 flex items-center space-x-2"
                  style={{ 
                    backgroundColor: customButtonBgColor,
                    color: customButtonTextColor
                  }}
                >
                  <span>{customButtonText}</span>
                  {customButtonIcon && (
                    <img src={customButtonIcon} alt="" className="h-4 w-4" />
                  )}
                </button>
              )}
              
              {/* Mobile User Authentication Section */}
              {user ? (
                <div className="mt-4 space-y-2">
                  <Link 
                    to="/dashboard" 
                    className="block hover:opacity-90 transition-opacity px-3 py-2 rounded-md text-left flex items-center space-x-2"
                    style={{ color: headerTextColor }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    to="/profile"
                    className="block px-3 py-2"
                    style={{ color: headerTextColor }}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Olá, {user.name || user.email}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left hover:opacity-90 transition-opacity px-3 py-2 rounded-md flex items-center space-x-2"
                    style={{ 
                      color: headerTextColor,
                      backgroundColor: 'rgba(255,255,255,0.1)'
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sair</span>
                  </button>
                </div>
              ) : (
                <Link 
                  to="/login" 
                  className="block hover:opacity-90 transition-opacity px-4 py-2 rounded-md mt-4 flex items-center"
                  style={{ 
                    backgroundColor: headerHoverColor,
                    color: '#ffffff'
                  }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="h-4 w-4 mr-2" />
                  {menuLogin}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
