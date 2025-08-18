/**
 * Utility functions to handle notification cache and ensure consistency across devices
 */

export const clearNotificationCache = () => {
  try {
    // Clear localStorage
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('notification') || key.includes('pending')) {
          localStorage.removeItem(key);
        }
      });
    }
    
    // Clear sessionStorage
    if (typeof window !== 'undefined') {
      const sessionKeys = Object.keys(sessionStorage);
      sessionKeys.forEach(key => {
        if (key.includes('notification') || key.includes('pending')) {
          sessionStorage.removeItem(key);
        }
      });
    }
    
    console.log('🧹 Notification cache cleared');
  } catch (error) {
    console.warn('⚠️ Error clearing notification cache:', error);
  }
};

export const forceNotificationRefresh = () => {
  // Force a page refresh for Vercel domains
  const isVercelDomain = window.location.hostname.includes('vercel.app') || 
                        window.location.hostname.includes('agromercado.tv.br');
  
  if (isVercelDomain) {
    // Add cache busting parameter
    const url = new URL(window.location.href);
    url.searchParams.set('_nc', Date.now().toString());
    
    // Update browser history without reloading
    window.history.replaceState({}, '', url.toString());
    
    console.log('🔄 Force refresh applied for Vercel domain');
  }
};

export const getUniqueChannelId = (userId: string) => {
  // Create a unique channel ID that persists across sessions for the same user
  const sessionId = sessionStorage.getItem('notification-session') || 
                   Math.random().toString(36).substring(7);
  
  if (!sessionStorage.getItem('notification-session')) {
    sessionStorage.setItem('notification-session', sessionId);
  }
  
  return `notifications-${userId}-${sessionId}`;
};

export const initializeNotificationSystem = () => {
  clearNotificationCache();
  forceNotificationRefresh();
  
  // Set up periodic cache clearing for long sessions
  const interval = setInterval(() => {
    clearNotificationCache();
  }, 5 * 60 * 1000); // Every 5 minutes
  
  // Clear interval on page unload
  window.addEventListener('beforeunload', () => {
    clearInterval(interval);
  });
  
  console.log('📧 Notification system initialized');
};