// Vercel-specific optimizations for custom domains
import { isProductionCustomDomain } from './domainHealth';

export const clearVercelCache = () => {
  // Force cache invalidation on custom domains
  if (isProductionCustomDomain()) {
    console.log('🧹 Clearing Vercel cache for custom domain');
    
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
  }
};

export const addCacheBustingHeaders = () => {
  if (isProductionCustomDomain()) {
    // Add meta tags to prevent caching
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Cache-Control';
    meta.content = 'no-cache, no-store, must-revalidate, max-age=0';
    document.head.appendChild(meta);
    
    const pragma = document.createElement('meta');
    pragma.httpEquiv = 'Pragma';
    pragma.content = 'no-cache';
    document.head.appendChild(pragma);
    
    const expires = document.createElement('meta');
    expires.httpEquiv = 'Expires';
    expires.content = '0';
    document.head.appendChild(expires);
  }
};

export const initializeVercelOptimizations = () => {
  clearVercelCache();
  addCacheBustingHeaders();
  
  // Force reload of critical resources on custom domain
  if (isProductionCustomDomain()) {
    console.log('🚀 Initializing Vercel optimizations for custom domain');
    
    // Preload critical resources with cache busting
    const timestamp = Date.now();
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = `/assets/index.js?v=${timestamp}`;
    link.as = 'script';
    document.head.appendChild(link);
  }
};