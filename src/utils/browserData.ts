export const collectBrowserData = () => {
  return {
    user_agent: navigator.userAgent,
    locale: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen_resolution: `${window.screen.width}x${window.screen.height}`,
    referrer: document.referrer || null,
    extra: {
      platform: navigator.platform,
      vendor: navigator.vendor,
      cookiesEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      hardwareConcurrency: navigator.hardwareConcurrency,
      maxTouchPoints: navigator.maxTouchPoints,
      online: navigator.onLine,
      screen: {
        colorDepth: window.screen.colorDepth,
        pixelDepth: window.screen.pixelDepth,
        availWidth: window.screen.availWidth,
        availHeight: window.screen.availHeight,
      },
      window: {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        outerWidth: window.outerWidth,
        outerHeight: window.outerHeight,
      }
    }
  };
};
