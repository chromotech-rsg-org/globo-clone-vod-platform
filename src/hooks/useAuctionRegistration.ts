
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuctionRegistration } from '@/types/auction';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { getUniqueChannelId, clearNotificationCache } from '@/utils/notificationCache';
import { isProductionCustomDomain } from '@/utils/domainHealth';
import { clearVercelCache } from '@/utils/vercelOptimizations';

export const useAuctionRegistration = (auctionId: string) => {
  const [registration, setRegistration] = useState<AuctionRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchRegistration = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 useAuctionRegistration: Buscando habilitação para:', user.id, 'leilão:', auctionId);
      
      if (isProductionCustomDomain()) {
        clearVercelCache();
        clearNotificationCache();
      }

      const { data, error } = await supabase
        .from('auction_registrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('auction_id', auctionId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      console.log('✅ useAuctionRegistration: Habilitação encontrada:', data);
      setRegistration(data as AuctionRegistration || null);
    } catch (error) {
      console.error('❌ useAuctionRegistration: Erro ao buscar habilitação:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateNextAllowedRegistration = (auction: any, lastRejectedAt: string) => {
    const rejectedDate = new Date(lastRejectedAt);
    const waitValue = auction.registration_wait_value || 5;
    const waitUnit = auction.registration_wait_unit || 'minutes';
    
    switch (waitUnit) {
      case 'minutes':
        rejectedDate.setMinutes(rejectedDate.getMinutes() + waitValue);
        break;
      case 'hours':
        rejectedDate.setHours(rejectedDate.getHours() + waitValue);
        break;
      case 'days':
        rejectedDate.setDate(rejectedDate.getDate() + waitValue);
        break;
    }
    
    return rejectedDate.toISOString();
  };

  const requestRegistration = async () => {
    if (!user?.id) return;

    try {
      console.log('📝 useAuctionRegistration: Solicitando habilitação');

      if (registration) {
        if (registration.status === 'rejected') {
          const { data: auctionData } = await supabase
            .from('auctions')
            .select('registration_wait_value, registration_wait_unit')
            .eq('id', auctionId)
            .single();

          const nextAllowedAt = calculateNextAllowedRegistration(auctionData, registration.updated_at);
          
          if (new Date() < new Date(nextAllowedAt)) {
            const timeLeft = new Date(nextAllowedAt).getTime() - new Date().getTime();
            const minutesLeft = Math.ceil(timeLeft / (1000 * 60));
            
            toast({
              title: "Aguarde",
              description: `Você poderá solicitar nova habilitação em ${minutesLeft} minutos`,
              variant: "destructive"
            });
            return;
          }

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
        } else if (registration.status === 'canceled') {
          // Reativar habilitação cancelada
          const { error } = await supabase
            .from('auction_registrations')
            .update({
              status: 'pending',
              updated_at: new Date().toISOString()
            })
            .eq('id', registration.id);

          if (error) throw error;
        } else if (registration.status === 'disabled') {
          // Reativar habilitação desabilitada manualmente
          const { error } = await supabase
            .from('auction_registrations')
            .update({
              status: 'pending',
              updated_at: new Date().toISOString(),
              client_notes: 'Solicitação de reativação após desativação manual'
            })
            .eq('id', registration.id);

          if (error) throw error;
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

      // Atualização imediata após envio
      setTimeout(() => {
        fetchRegistration();
      }, 500);

    } catch (error: any) {
      console.error('❌ useAuctionRegistration: Erro ao solicitar habilitação:', error);
      
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

  const reactivateRegistration = async () => {
    if (!user?.id || !registration) return false;

    try {
      console.log('🔄 useAuctionRegistration: Reativando habilitação cancelada');

      const { error } = await supabase
        .from('auction_registrations')
        .update({
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', registration.id);

      if (error) throw error;

      toast({
        title: "Habilitação reativada",
        description: "Sua solicitação de habilitação foi reativada e está em análise",
      });

      // Atualização imediata
      setTimeout(() => {
        fetchRegistration();
      }, 500);

      return true;
    } catch (error: any) {
      console.error('❌ useAuctionRegistration: Erro ao reativar habilitação:', error);
      
      toast({
        title: "Erro",
        description: "Não foi possível reativar a habilitação",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    if (!auctionId || !user?.id) return;

    console.log('🎯 useAuctionRegistration: Inicializando para leilão:', auctionId);
    
    if (isProductionCustomDomain()) {
      clearVercelCache();
    }
    clearNotificationCache();
    
    fetchRegistration();
    
    // Setup real-time subscription com ID único
    const channelName = getUniqueChannelId(`registration-${auctionId}-${user.id}`);
    
    const handleRegistrationChange = (payload: any) => {
      console.log('🔔 useAuctionRegistration: Mudança detectada:', payload);
      
      if (isProductionCustomDomain()) {
        clearVercelCache();
      }
      clearNotificationCache();
      
      // Para atualizações de status, mostrar toast e atualizar imediatamente
      if (payload.eventType === 'UPDATE' && payload.new?.user_id === user.id) {
        const newStatus = payload.new.status;
        const oldStatus = payload.old?.status;
        
        if (newStatus !== oldStatus) {
          console.log('✨ useAuctionRegistration: Mudança de status detectada:', oldStatus, '->', newStatus);
          
          // Mostrar toast apropriado
          if (newStatus === 'approved') {
            toast({
              title: "Habilitação Aprovada! ✅",
              description: "Sua habilitação foi aprovada! Agora você pode participar do leilão.",
            });
          } else if (newStatus === 'rejected') {
            toast({
              title: "Habilitação Rejeitada ❌",
              description: payload.new.client_notes || "Sua habilitação foi rejeitada.",
              variant: "destructive"
            });
          } else if (newStatus === 'canceled') {
            toast({
              title: "Habilitação Cancelada",
              description: "Sua habilitação foi cancelada.",
              variant: "destructive"
            });
          } else if (newStatus === 'disabled') {
            toast({
              title: "Habilitação Desabilitada ⛔",
              description: "Sua habilitação foi desabilitada pelo administrador. Você pode solicitar uma nova habilitação.",
              variant: "destructive"
            });
          }
          
          // Atualização imediata para mudanças de status
          setRegistration(payload.new);
        }
      } else if (payload.eventType === 'INSERT' && payload.new?.user_id === user.id) {
        console.log('📝 useAuctionRegistration: Nova habilitação criada');
        setRegistration(payload.new);
      } else {
        // Para outros eventos, atualizar com delay
        setTimeout(() => {
          fetchRegistration();
        }, 1000);
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
          console.log('📡 useAuctionRegistration: Subscription status:', status);
        });
        
    } catch (error) {
      console.error('❌ useAuctionRegistration: Erro ao configurar subscription:', error);
      
      // Fallback para polling em caso de erro
      if (isProductionCustomDomain()) {
        console.log('🔄 useAuctionRegistration: Fallback para polling');
        const pollInterval = setInterval(() => {
          fetchRegistration();
        }, 10000); // Poll a cada 10 segundos
        
        return () => {
          clearInterval(pollInterval);
        };
      }
    }

    return () => {
      if (subscription) {
        console.log('🔌 useAuctionRegistration: Removendo subscription');
        supabase.removeChannel(subscription);
      }
    };
  }, [auctionId, user?.id, toast]);

  return { 
    registration, 
    loading, 
    requestRegistration, 
    reactivateRegistration,
    refetch: fetchRegistration 
  };
};
