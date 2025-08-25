
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook simples e estável para verificar se o usuário possui assinatura ativa.
 * - Nunca altera a quantidade de hooks entre renders.
 * - Evita assinaturas realtime e complexidade desnecessária.
 */
export const useSimpleSubscriptionCheck = (
  userId?: string | null,
  enabled: boolean = true
) => {
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Se desabilitado ou sem usuário, não checa a assinatura
    if (!enabled || !userId) {
      setLoading(false);
      setHasActiveSubscription(false);
      return;
    }

    let isMounted = true;

    const check = async () => {
      // Inicia carregamento a cada checagem
      setLoading(true);

      const { data, error } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.warn('useSimpleSubscriptionCheck: error checking subscription', error);
      }

      if (isMounted) {
        setHasActiveSubscription(!!data && data.status === 'active');
        setLoading(false);
      }
    };

    check();

    return () => {
      isMounted = false;
    };
  }, [userId, enabled]);

  return { hasActiveSubscription, loading };
};
