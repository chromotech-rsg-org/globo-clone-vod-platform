
import { useCustomizations } from '@/hooks/useCustomizations';

export const useSiteCustomizations = () => {
  const { getCustomization, loading } = useCustomizations('global');

  const siteName = getCustomization('site', 'site_name', 'AgroMercado TV');
  const siteLogo = getCustomization('site', 'site_logo', '');
  const streamingUrl = getCustomization('site', 'streaming_url', '');

  return {
    siteName,
    siteLogo,
    streamingUrl,
    loading
  };
};
