
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCustomizations } from '@/hooks/useCustomizations';
import { useAuth } from '@/contexts/AuthContext';
import { ExternalLink, User, LogOut, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const Header = () => {
  const { getCustomization } = useCustomizations('home');
  const { user, logout } = useAuth();

  const logoImage = getCustomization('header_logo_image', '');
  const homeText = getCustomization('header_menu_home', 'Início');
  const contentText = getCustomization('header_menu_content', 'Conteúdo');
  const plansText = getCustomization('header_menu_plans', 'Planos');
  const loginText = getCustomization('header_menu_login', 'Entrar');
  
  // Novos campos para o botão customizado e streaming
  const customButtonText = getCustomization('custom_button_text', '');
  const customButtonLink = getCustomization('custom_button_link', '');
  const customButtonIcon = getCustomization('custom_button_icon', '');
  const customButtonBg = getCustomization('custom_button_bg_color', '#3b82f6');
  const customButtonTextColor = getCustomization('custom_button_text_color', '#ffffff');
  const streamingLink = getCustomization('streaming_link', '');
  const siteName = getCustomization('global_site_name', 'Globoplay');

  const headerBg = getCustomization('header_background_color', 'transparent');
  const textColor = getCustomization('header_text_color', '#ffffff');
  const hoverColor = getCustomization('header_hover_color', '#ef4444');
  const contentBg = getCustomization('content_background_color', 'transparent');

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserDisplayName = () => {
    if (user?.name) return user.name;
    if (user?.email) return user.email;
    return 'Usuário';
  };

  return (
    <header 
      className="absolute top-0 left-0 right-0 z-50 px-6 py-4"
      style={{
        backgroundColor: headerBg !== 'transparent' ? headerBg : 'transparent'
      }}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex-shrink-0">
          {logoImage ? (
            <Link to="/">
              <img src={logoImage} alt="Logo" className="h-8 md:h-10" />
            </Link>
          ) : (
            <Link 
              to="/" 
              className="text-xl font-bold"
              style={{ color: textColor }}
            >
              {siteName}
            </Link>
          )}
        </div>

        {/* User Display - Show when logged in */}
        {user && (
          <div className="hidden md:flex items-center gap-2 text-sm" style={{ color: textColor }}>
            <User className="h-4 w-4" />
            <span>Olá, {getUserDisplayName()}</span>
          </div>
        )}

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link 
            to="/" 
            className="hover:scale-105 transition-all duration-200"
            style={{ 
              color: textColor,
              '--hover-color': hoverColor
            } as React.CSSProperties}
            onMouseEnter={(e) => e.currentTarget.style.color = hoverColor}
            onMouseLeave={(e) => e.currentTarget.style.color = textColor}
          >
            {homeText}
          </Link>
          
          <Link 
            to="/content" 
            className="hover:scale-105 transition-all duration-200"
            style={{ 
              color: textColor,
              '--hover-color': hoverColor
            } as React.CSSProperties}
            onMouseEnter={(e) => e.currentTarget.style.color = hoverColor}
            onMouseLeave={(e) => e.currentTarget.style.color = textColor}
          >
            {contentText}
          </Link>
          
          <Link 
            to="/plans" 
            className="hover:scale-105 transition-all duration-200"
            style={{ 
              color: textColor,
              '--hover-color': hoverColor
            } as React.CSSProperties}
            onMouseEnter={(e) => e.currentTarget.style.color = hoverColor}
            onMouseLeave={(e) => e.currentTarget.style.color = textColor}
          >
            {plansText}
          </Link>

          <Link 
            to="/leiloes" 
            className="hover:scale-105 transition-all duration-200"
            style={{ 
              color: textColor,
              '--hover-color': hoverColor
            } as React.CSSProperties}
            onMouseEnter={(e) => e.currentTarget.style.color = hoverColor}
            onMouseLeave={(e) => e.currentTarget.style.color = textColor}
          >
            Leilões
          </Link>

          {/* Botão de streaming configurável */}
          {streamingLink && (
            <a
              href={streamingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 hover:opacity-80"
              style={{
                backgroundColor: customButtonBg,
                color: customButtonTextColor
              }}
            >
              {customButtonIcon && (
                <img src={customButtonIcon} alt="" className="w-4 h-4" />
              )}
              Assistir no {siteName}
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          {/* Botão customizado adicional */}
          {customButtonText && customButtonLink && (
            <a
              href={customButtonLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 hover:opacity-80"
              style={{
                backgroundColor: customButtonBg,
                color: customButtonTextColor
              }}
            >
              {customButtonIcon && (
                <img src={customButtonIcon} alt="" className="w-4 h-4" />
              )}
              {customButtonText}
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </nav>

        {/* Auth Section */}
        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback style={{ backgroundColor: customButtonBg, color: customButtonTextColor }}>
                      {getUserInitials(getUserDisplayName())}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium text-sm">
                      {getUserDisplayName()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Painel
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button 
                variant="outline" 
                className="border-white/20 hover:bg-white/10"
                style={{ color: textColor }}
              >
                {loginText}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
