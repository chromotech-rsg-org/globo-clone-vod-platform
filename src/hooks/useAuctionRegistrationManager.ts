
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const useAuctionRegistrationManager = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const cancelRegistration = async (registrationId: string) => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('auction_registrations')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString()
        })
        .eq('id', registrationId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Habilitação cancelada",
        description: "Sua habilitação foi cancelada com sucesso",
      });

      return true;
    } catch (error: any) {
      console.error('Erro ao cancelar habilitação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar a habilitação",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const requestNewRegistration = async (auctionId: string) => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Verificar se já existe uma habilitação cancelada
      const { data: existingRegistration } = await supabase
        .from('auction_registrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('auction_id', auctionId)
        .eq('status', 'canceled')
        .single();

      if (existingRegistration) {
        // Reativar habilitação cancelada
        const { error } = await supabase
          .from('auction_registrations')
          .update({
            status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRegistration.id);

        if (error) throw error;
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
        title: "Nova solicitação enviada",
        description: "Sua nova solicitação de habilitação foi enviada para análise",
      });

      return true;
    } catch (error: any) {
      console.error('Erro ao solicitar nova habilitação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a nova solicitação",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const reactivateRegistration = async (registrationId: string) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('auction_registrations')
        .update({
          status: 'approved',
          updated_at: new Date().toISOString(),
          approved_by: user?.id
        })
        .eq('id', registrationId);

      if (error) throw error;

      toast({
        title: "Habilitação reativada",
        description: "A habilitação foi reativada com sucesso",
      });

      return true;
    } catch (error: any) {
      console.error('Erro ao reativar habilitação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível reativar a habilitação",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    cancelRegistration,
    requestNewRegistration,
    reactivateRegistration
  };
};
