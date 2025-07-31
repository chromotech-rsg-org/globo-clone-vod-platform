
import React from 'react';
import { useCustomizations } from '@/hooks/useCustomizations';

const Footer = () => {
  const { getCustomization } = useCustomizations('home');
  
  const footerBgColor = getCustomization('footer', 'footer_background_color', '#1f2937');
  const footerTextColor = getCustomization('footer', 'footer_text_color', '#ffffff');
  const copyrightText = getCustomization('footer', 'footer_copyright', '© 2024 Todos os direitos reservados');
  const logoImage = getCustomization('footer', 'footer_logo_image', '');
  const siteName = getCustomization('global', 'site_name', 'Globoplay');
  
  return (
    <footer 
      className="border-t border-gray-800 py-12"
      style={{ backgroundColor: footerBgColor, color: footerTextColor }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              {logoImage ? (
                <img src={logoImage} alt={siteName} className="h-10 w-auto" />
              ) : (
                <div className="bg-blue-600 text-white px-3 py-1 rounded font-bold">G</div>
              )}
              <span className="text-white font-bold">{siteName}</span>
            </div>
            <p className="text-gray-400 text-sm">
              {getCustomization('footer', 'description', 'Sua plataforma de streaming com o melhor conteúdo nacional e internacional.')}
            </p>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Navegação</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Início</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Filmes</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Séries</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Novelas</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Suporte</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Central de Ajuda</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacidade</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Redes Sociais</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Facebook</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
              <li><a href="#" className="hover:text-white transition-colors">YouTube</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8">
          <p className="text-center text-sm" style={{ color: footerTextColor }}>
            {copyrightText}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
