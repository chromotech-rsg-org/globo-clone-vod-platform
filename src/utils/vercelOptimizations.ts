
// Vercel-specific optimizations for custom domains
import { isProductionCustomDomain } from './domainHealth';

export const clearVercelCache = () => {
  // Force cache invalidation on custom domains
  if (isProductionCustomDomain()) {
    console.log('🧹 Clearing Vercel cache for custom domain');
    
    try {
      // Add cache-busting query parameter
      const url = new URL(window.location.href);
      url.searchParams.set('_vercel_cache_bust', Date.now().toString());
      
      // Update browser history without triggering navigation
      window.history.replaceState({}, '', url.toString());
      
      // Clear browser caches
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => {
            registration.update();
          });
        });
      }
      
      // Clear localStorage and sessionStorage for cache-related items
      try {
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('customization') || key.includes('notification')) {
            localStorage.removeItem(key);
          }
        });
        
        Object.keys(sessionStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('customization') || key.includes('notification')) {
            sessionStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.warn('⚠️ Could not clear storage:', error);
      }
      
    } catch (error) {
      console.warn('⚠️ Cache clearing failed:', error);
    }
  }
};

export const addCacheBustingHeaders = () => {
  if (isProductionCustomDomain()) {
    // Add meta tags to prevent caching
    const existingMeta = document.querySelector('meta[http-equiv="Cache-Control"]');
    if (!existingMeta) {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Cache-Control';
      meta.content = 'no-cache, no-store, must-revalidate, max-age=0';
      document.head.appendChild(meta);
    }
    
    const existingPragma = document.querySelector('meta[http-equiv="Pragma"]');
    if (!existingPragma) {
      const pragma = document.createElement('meta');
      pragma.httpEquiv = 'Pragma';
      pragma.content = 'no-cache';
      document.head.appendChild(pragma);
    }
    
    const existingExpires = document.querySelector('meta[http-equiv="Expires"]');
    if (!existingExpires) {
      const expires = document.createElement('meta');
      expires.httpEquiv = 'Expires';
      expires.content = '0';
      document.head.appendChild(expires);
    }
  }
};

export const initializeVercelOptimizations = () => {
  clearVercelCache();
  addCacheBustingHeaders();
  
  // Force reload of critical resources on custom domain
  if (isProductionCustomDomain()) {
    console.log('🚀 Initializing Vercel optimizations for custom domain');
    
    // Enhanced resource preloading with cache busting
    const timestamp = Date.now();
    
    // Preload critical CSS with cache busting
    const cssLink = document.createElement('link');
    cssLink.rel = 'preload';
    cssLink.href = `/assets/index.css?v=${timestamp}`;
    cssLink.as = 'style';
    document.head.appendChild(cssLink);
    
    // Preload critical JavaScript with cache busting
    const jsLink = document.createElement('link');
    jsLink.rel = 'preload';
    jsLink.href = `/assets/index.js?v=${timestamp}`;
    jsLink.as = 'script';
    document.head.appendChild(jsLink);
    
    // Set up periodic cache clearing for long sessions
    const clearInterval = setInterval(() => {
      clearVercelCache();
    }, 5 * 60 * 1000); // Every 5 minutes
    
    // Clear interval on page unload
    window.addEventListener('beforeunload', () => {
      clearInterval(clearInterval);
    });
  }
};

// Enhanced function to force refresh specific resources
export const forceRefreshCriticalResources = () => {
  if (isProductionCustomDomain()) {
    console.log('🔄 Force refreshing critical resources for production domain');
    
    const timestamp = Date.now();
    
    // Force refresh of CSS by adding timestamp
    const existingCSS = document.querySelector('link[href*="index.css"]');
    if (existingCSS) {
      const newCSS = existingCSS.cloneNode(true) as HTMLLinkElement;
      newCSS.href = newCSS.href.includes('?') 
        ? `${newCSS.href}&t=${timestamp}` 
        : `${newCSS.href}?t=${timestamp}`;
      existingCSS.parentNode?.insertBefore(newCSS, existingCSS.nextSibling);
      setTimeout(() => existingCSS.remove(), 1000);
    }
  }
};
