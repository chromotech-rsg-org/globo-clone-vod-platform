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
      // Buscar dados do leilão para calcular próxima habilitação
      const { data: auctionData } = await supabase
        .from('auctions')
        .select('registration_wait_value, registration_wait_unit')
        .eq('id', auctionId)
        .single();

      const nextAllowedAt = registration?.status === 'rejected' && registration?.updated_at
        ? calculateNextAllowedRegistration(auctionData, registration.updated_at)
        : null;

      // Verificar se ainda está no período de espera
      if (nextAllowedAt && new Date() < new Date(nextAllowedAt)) {
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
        .insert({
          user_id: user.id,
          auction_id: auctionId,
          status: 'pending',
          next_registration_allowed_at: nextAllowedAt
        });

      if (error) throw error;

      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação de habilitação foi enviada para análise",
      });

      fetchRegistration();
    } catch (error) {
      console.error('Error requesting registration:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a solicitação",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (auctionId && user?.id) {
      fetchRegistration();
    }
  }, [auctionId, user?.id]);

  return { 
    registration, 
    loading, 
    requestRegistration, 
    refetch: fetchRegistration 
  };
};