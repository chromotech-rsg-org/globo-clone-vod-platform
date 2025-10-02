import { Helmet } from 'react-helmet-async';
import { useCustomizations } from '@/hooks/useCustomizations';

export const DynamicSEO = () => {
  const { getCustomization } = useCustomizations('home');
  
  const siteName = getCustomization('global', 'site_name', 'Agromercado');
  const siteDescription = getCustomization('global', 'site_description', 'Plataforma completa de leilões rurais ao vivo com transmissão, lances em tempo real e gestão completa');
  const logoUrl = getCustomization('global', 'logo_url', '');
  
  // Use logo URL for Open Graph image, or fallback to a default
  const ogImage = logoUrl || 'https://minhaconta.agromercado.tv.br/og-image.png';
  
  return (
    <Helmet>
      <title>{siteName}</title>
      <meta name="description" content={siteDescription} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={siteName} />
      <meta property="og:description" content={siteDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content="https://minhaconta.agromercado.tv.br" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteName} />
      <meta name="twitter:description" content={siteDescription} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Additional SEO */}
      <meta name="author" content={siteName} />
      <link rel="canonical" href="https://minhaconta.agromercado.tv.br" />
    </Helmet>
  );
};
