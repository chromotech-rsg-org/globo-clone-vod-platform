// Utility for checking domain-specific health and connectivity
import { supabase } from '@/integrations/supabase/client';

export interface DomainHealthCheck {
  domain: string;
  supabaseConnectivity: boolean;
  authState: 'loading' | 'authenticated' | 'unauthenticated' | 'error';
  networkLatency?: number;
  errors: string[];
}

export const performDomainHealthCheck = async (): Promise<DomainHealthCheck> => {
  const domain = window.location.hostname;
  const result: DomainHealthCheck = {
    domain,
    supabaseConnectivity: false,
    authState: 'loading',
    errors: []
  };

  console.log(`🏥 Starting health check for domain: ${domain}`);

  // Test 1: Supabase Connectivity
  try {
    const startTime = Date.now();
    const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    const endTime = Date.now();
    
    result.networkLatency = endTime - startTime;
    
    if (error) {
      result.errors.push(`Supabase connectivity error: ${error.message}`);
      console.error(`❌ Supabase connectivity failed on ${domain}:`, error);
    } else {
      result.supabaseConnectivity = true;
      console.log(`✅ Supabase connectivity successful on ${domain} (${result.networkLatency}ms)`);
    }
  } catch (error: any) {
    result.errors.push(`Supabase connectivity exception: ${error.message}`);
    console.error(`❌ Supabase connectivity exception on ${domain}:`, error);
  }

  // Test 2: Auth State
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      result.authState = 'error';
      result.errors.push(`Auth session error: ${error.message}`);
      console.error(`❌ Auth session error on ${domain}:`, error);
    } else if (session) {
      result.authState = 'authenticated';
      console.log(`✅ User authenticated on ${domain}:`, session.user?.email);
    } else {
      result.authState = 'unauthenticated';
      console.log(`ℹ️ No active session on ${domain}`);
    }
  } catch (error: any) {
    result.authState = 'error';
    result.errors.push(`Auth session exception: ${error.message}`);
    console.error(`❌ Auth session exception on ${domain}:`, error);
  }

  // Test 3: Custom Domain Specific Checks
  if (domain.includes('agromercado.tv.br')) {
    console.log(`🔧 Running custom domain specific checks for ${domain}`);
    
    // Check if CORS is properly configured
    try {
      const corsTest = await fetch(`${window.location.origin}/api/health`, { method: 'HEAD' });
      console.log(`🌐 CORS test for ${domain}:`, corsTest.status);
    } catch (error: any) {
      console.log(`🌐 CORS test unavailable for ${domain}:`, error.message);
      // This is expected if there's no health endpoint
    }
  }

  console.log(`🏥 Health check completed for ${domain}:`, result);
  return result;
};

export const isDevelopmentMode = () => {
  return process.env.NODE_ENV === 'development' || 
         window.location.hostname === 'localhost' ||
         window.location.hostname.includes('lovable');
};

export const isCustomDomain = () => {
  return window.location.hostname.includes('agromercado.tv.br');
};

export const isProductionCustomDomain = () => {
  return window.location.hostname === 'minhaconta.agromercado.tv.br';
};

export const getRealtimeConfig = () => {
  const isCustom = isCustomDomain();
  const isProd = isProductionCustomDomain();
  
  // Custom config for production custom domain
  if (isProd) {
    return {
      heartbeatIntervalMs: 30000,
      reconnectAfterMs: (tries: number) => [1000, 2000, 5000, 10000][tries - 1] || 10000,
      rejoinAfterMs: (tries: number) => [1000, 2000, 5000][tries - 1] || 5000,
      transport: 'websocket' as const,
      timeout: 10000,
      longpollerTimeout: 20000,
      logger: (kind: string, msg: string, data?: any) => {
        console.log(`🔌 Realtime [${kind}]:`, msg, data);
      }
    };
  }
  
  // Default config for other domains
  return {
    heartbeatIntervalMs: 15000,
    reconnectAfterMs: (tries: number) => [1000, 2000, 5000][tries - 1] || 5000,
    rejoinAfterMs: (tries: number) => [1000, 2000][tries - 1] || 2000
  };
};

export const logDomainInfo = () => {
  const domain = window.location.hostname;
  const isDev = isDevelopmentMode();
  const isCustom = isCustomDomain();
  const isProd = isProductionCustomDomain();
  
  console.log(`🌐 Domain Information:`, {
    domain,
    isDevelopment: isDev,
    isCustomDomain: isCustom,
    isProductionCustomDomain: isProd,
    protocol: window.location.protocol,
    port: window.location.port,
    fullUrl: window.location.href,
    realtimeConfig: getRealtimeConfig()
  });
  
  return { domain, isDev, isCustom, isProd };
};