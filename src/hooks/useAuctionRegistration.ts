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

  const requestRegistration = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('auction_registrations')
        .insert({
          user_id: user.id,
          auction_id: auctionId,
          status: 'pending'
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