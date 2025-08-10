import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuctionRegistration } from '@/types/auction';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

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
      const { data, error } = await supabase
        .from('auction_registrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('auction_id', auctionId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      setRegistration(data as AuctionRegistration || null);
    } catch (error) {
      console.error('Error fetching registration:', error);
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
      // Verificar se já existe uma habilitação
      if (registration) {
        // Se existe e está rejeitada, verificar se pode solicitar novamente
        if (registration.status === 'rejected') {
          // Buscar dados do leilão para calcular próxima habilitação
          const { data: auctionData } = await supabase
            .from('auctions')
            .select('registration_wait_value, registration_wait_unit')
            .eq('id', auctionId)
            .single();

          const nextAllowedAt = calculateNextAllowedRegistration(auctionData, registration.updated_at);
          
          // Verificar se ainda está no período de espera
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

          // Atualizar status para pending se passou do tempo de espera
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
        // Criar nova habilitação
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

      fetchRegistration();
    } catch (error: any) {
      console.error('Error requesting registration:', error);
      
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
    if (auctionId && user?.id) {
      fetchRegistration();
      
      // Set up real-time subscription to monitor registration status changes
      const subscription = supabase
        .channel(`registration-${auctionId}-${Math.random().toString(36).substring(7)}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'auction_registrations',
            filter: `auction_id=eq.${auctionId}`
          },
          (payload) => {
            console.info('🔄 Registration status updated:', payload);
            fetchRegistration();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [auctionId, user?.id]);

  return { 
    registration, 
    loading, 
    requestRegistration, 
    refetch: fetchRegistration 
  };
};