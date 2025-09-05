
// Vercel-specific optimizations for custom domains
import { isProductionCustomDomain } from './domainHealth';

// Re-export the function so other files can import it
export { isProductionCustomDomain };

export const clearVercelCache = () => {
  // Force cache invalidation on custom domains
  if (isProductionCustomDomain()) {
    console.log('🧹 Clearing Vercel cache for custom domain');
    
    try {
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
    
    // Resources are handled by Vite's built-in caching
    
    // Set up periodic cache clearing for long sessions
    const clearIntervalId = setInterval(() => {
      clearVercelCache();
    }, 5 * 60 * 1000); // Every 5 minutes
    
    // Clear interval on page unload
    window.addEventListener('beforeunload', () => {
      clearInterval(clearIntervalId);
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
