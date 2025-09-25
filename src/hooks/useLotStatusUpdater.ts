import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useLotStatusUpdater = () => {
  const { toast } = useToast();

  const updateLotStatuses = async (auctionId: string) => {
    try {
      const { error } = await supabase.rpc('update_auction_lot_statuses', {
        auction_uuid: auctionId
      });

      if (error) throw error;

      toast({
        title: "Status dos lotes atualizado",
        description: "Os status dos lotes foram atualizados baseado no estado do leilão.",
      });

      return true;
    } catch (error: any) {
      console.error('Error updating lot statuses:', error);
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  return { updateLotStatuses };
};