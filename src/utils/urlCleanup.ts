
// Utility to clean cache-busting and other unwanted URL parameters
export const cleanUrl = () => {
  const url = new URL(window.location.href);
  const paramsToRemove = [
    '_vercel_cache_bust',
    '_nc',
    '_timestamp',
    'cache_bust'
  ];
  
  let urlChanged = false;
  
  paramsToRemove.forEach(param => {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param);
      urlChanged = true;
    }
  });
  
  if (urlChanged) {
    window.history.replaceState({}, '', url.toString());
  }
};

// Auto-clean URL on page load
if (typeof window !== 'undefined') {
  cleanUrl();
  
  // Also clean on navigation changes
  window.addEventListener('popstate', cleanUrl);
}
