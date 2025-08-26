
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuctionRegistration } from '@/types/auction';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export const useEnhancedAuctionRegistration = (auctionId: string) => {
  const [registration, setRegistration] = useState<AuctionRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const mounted = useRef(true);
  const retryCount = useRef(0);
  const maxRetries = 3;

  const fetchRegistration = async () => {
    if (!user?.id || !auctionId || !mounted.current) return;

    try {
      console.log('🔄 Enhanced: Fetching registration for user:', user.id, 'auction:', auctionId);
      
      const { data, error } = await supabase
        .from('auction_registrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('auction_id', auctionId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      console.log('✅ Enhanced: Registration found:', data);
      if (mounted.current) {
        setRegistration(data as AuctionRegistration || null);
        retryCount.current = 0; // Reset retry count on success
      }
    } catch (error) {
      console.error('❌ Enhanced: Error fetching registration:', error);
      
      // Retry logic
      if (retryCount.current < maxRetries && mounted.current) {
        retryCount.current++;
        console.log(`🔄 Enhanced: Retrying... (${retryCount.current}/${maxRetries})`);
        setTimeout(() => {
          if (mounted.current) {
            fetchRegistration();
          }
        }, 2000 * retryCount.current); // Exponential backoff
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  };

  const requestRegistration = async () => {
    if (!user?.id || !auctionId) return;

    try {
      console.log('📝 Enhanced: Requesting registration');

      if (registration) {
        if (registration.status === 'rejected') {
          const { error } = await supabase
            .from('auction_registrations')
            .update({
              status: 'pending',
              updated_at: new Date().toISOString()
            })
            .eq('id', registration.id);

          if (error) throw error;
        } else if (registration.status === 'pending') {
          toast({
            title: "Solicitação já enviada",
            description: "Você já possui uma solicitação em análise",
            variant: "destructive"
          });
          return;
        } else if (registration.status === 'approved') {
          toast({
            title: "Já habilitado",
            description: "Você já está habilitado para este leilão",
            variant: "destructive"
          });
          return;
        }
      } else {
        const { error } = await supabase
          .from('auction_registrations')
          .insert({
            user_id: user.id,
            auction_id: auctionId,
            status: 'pending'
          });

        if (error) throw error;
      }

      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação de habilitação foi enviada para análise",
      });

      // Immediate refresh
      setTimeout(() => {
        fetchRegistration();
      }, 500);

    } catch (error: any) {
      console.error('❌ Enhanced: Error requesting registration:', error);
      
      let errorMessage = "Não foi possível enviar a solicitação";
      if (error?.message?.includes('duplicate key')) {
        errorMessage = "Você já possui uma solicitação para este leilão";
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (!auctionId || !user?.id) return;

    mounted.current = true;
    fetchRegistration();
    
    // Enhanced real-time subscription with precise filtering
    const channelName = `enhanced-registration-${auctionId}-${user.id}-${Date.now()}`;
    
    const handleRegistrationChange = (payload: any) => {
      console.log('🔔 Enhanced: Registration change detected:', payload);
      
      // Only process if it's for this specific user and auction
      if (payload.new?.user_id === user.id && payload.new?.auction_id === auctionId) {
        console.log('✨ Enhanced: Processing relevant registration change');
        
        // Immediate update for status changes
        if (payload.eventType === 'UPDATE') {
          const newStatus = payload.new.status;
          const oldStatus = payload.old?.status;
          
          if (newStatus !== oldStatus) {
            console.log('📝 Enhanced: Status change detected:', oldStatus, '->', newStatus);
            
            // Update local state immediately
            if (mounted.current) {
              setRegistration(payload.new);
            }
            
            // Show toast notification (handled by global notifications)
            fetchRegistration(); // Refresh to ensure consistency
          }
        } else if (payload.eventType === 'INSERT') {
          console.log('📝 Enhanced: New registration created');
          fetchRegistration();
        }
      }
    };

    let subscription: any;
    
    try {
      subscription = supabase
        .channel(channelName)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'auction_registrations',
          filter: `user_id=eq.${user.id}`
        }, handleRegistrationChange)
        .subscribe((status) => {
          console.log('📡 Enhanced: Registration subscription status:', status);
          
          // Reconnection logic
          if (status === 'CLOSED' && mounted.current) {
            console.log('🔌 Enhanced: Connection closed, setting up fallback polling');
            const pollInterval = setInterval(() => {
              if (mounted.current) {
                fetchRegistration();
              } else {
                clearInterval(pollInterval);
              }
            }, 10000); // Poll every 10 seconds as fallback
            
            setTimeout(() => {
              clearInterval(pollInterval);
            }, 60000); // Stop polling after 1 minute
          }
        });
        
    } catch (error) {
      console.error('❌ Enhanced: Error setting up subscription:', error);
      
      // Fallback to polling if realtime fails
      const pollInterval = setInterval(() => {
        if (mounted.current) {
          fetchRegistration();
        } else {
          clearInterval(pollInterval);
        }
      }, 15000); // Poll every 15 seconds
      
      return () => {
        clearInterval(pollInterval);
      };
    }

    return () => {
      mounted.current = false;
      if (subscription) {
        console.log('🔌 Enhanced: Removing registration subscription');
        supabase.removeChannel(subscription);
      }
    };
  }, [auctionId, user?.id]);

  return { 
    registration, 
    loading, 
    requestRegistration, 
    refetch: fetchRegistration 
  };
};
