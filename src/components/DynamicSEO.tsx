import { Helmet } from 'react-helmet-async';
import { useCustomizations } from '@/hooks/useCustomizations';

export const DynamicSEO = () => {
  const { getCustomization } = useCustomizations('home');
  
  const siteName = getCustomization('global', 'site_name', 'Agromercado');
  const siteDescription = getCustomization('global', 'site_description', 'Agora o conteúdo mais relevante do mercado agro está ao seu alcance, em qualquer lugar! Notícias, eventos e muitos mais na nossa plataforma de streaming.');
  const logoUrl = getCustomization('global', 'logo_url', '');
  const faviconUrl = getCustomization('global', 'favicon_image', '');
  const siteKeywords = getCustomization('global', 'site_keywords', 'agromercado, agro, notícias, eventos, streaming, agricultura, pecuária, agronegócio');
  
  // Get current URL dynamically
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  
  // Use logo URL for Open Graph image
  const ogImage = logoUrl || '';
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{siteName}</title>
      <meta name="description" content={siteDescription} />
      <meta name="keywords" content={siteKeywords} />
      <meta name="author" content={siteName} />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="Portuguese" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* Favicon */}
      {faviconUrl && <link rel="icon" type="image/png" href={faviconUrl} />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={siteName} />
      <meta property="og:description" content={siteDescription} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      {ogImage && <meta property="og:image:secure_url" content={ogImage} />}
      {ogImage && <meta property="og:image:type" content="image/png" />}
      {ogImage && <meta property="og:image:width" content="1200" />}
      {ogImage && <meta property="og:image:height" content="630" />}
      {ogImage && <meta property="og:image:alt" content={siteName} />}
      {currentUrl && <meta property="og:url" content={currentUrl} />}
      <meta property="og:locale" content="pt_BR" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteName} />
      <meta name="twitter:description" content={siteDescription} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
      {ogImage && <meta name="twitter:image:alt" content={siteName} />}
      
      {/* WhatsApp specific */}
      {ogImage && <meta property="og:image:url" content={ogImage} />}
      
      {/* Canonical URL */}
      {currentUrl && <link rel="canonical" href={currentUrl} />}
    </Helmet>
  );
};
