import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCustomizations } from './useCustomizations';

export const useSiteTitle = () => {
  const location = useLocation();
  const { customizations } = useCustomizations('home');

  const siteName = customizations['global_global_site_name'] || 'Sistema';

  useEffect(() => {
    const updateTitle = () => {
      const path = location.pathname;
      
      if (path.startsWith('/admin') || path.startsWith('/dashboard')) {
        document.title = `${siteName} - Painel Administrativo`;
      } else if (path === '/login') {
        document.title = `${siteName} - Login`;
      } else if (path === '/checkout') {
        document.title = `${siteName} - Checkout`;
      } else {
        document.title = `${siteName} - Plataforma de Streaming`;
      }
    };

    updateTitle();
  }, [location.pathname, siteName]);
};