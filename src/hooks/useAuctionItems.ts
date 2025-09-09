import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuctionItem } from '@/types/auction';
import { useToast } from '@/hooks/use-toast';

export const useAuctionItems = (auctionId: string | undefined) => {
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchItems = useCallback(async () => {
    if (!auctionId) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('auction_items')
        .select('*')
        .eq('auction_id', auctionId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setItems((data || []) as AuctionItem[]);
    } catch (error: any) {
      console.error('Error fetching auction items:', error);
      toast({
        title: "Erro ao carregar lotes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [auctionId, toast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Set up real-time subscription
  useEffect(() => {
    if (!auctionId) return;

    const channel = supabase
      .channel('auction_items_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'auction_items',
          filter: `auction_id=eq.${auctionId}`,
        },
        () => {
          fetchItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [auctionId, fetchItems]);

  const updateItemOrder = useCallback(async (itemId: string, newOrderIndex: number) => {
    try {
      const { error } = await supabase
        .from('auction_items')
        .update({ order_index: newOrderIndex })
        .eq('id', itemId);

      if (error) throw error;
      
      toast({
        title: "Ordem atualizada",
        description: "A ordem do lote foi atualizada com sucesso.",
      });
    } catch (error: any) {
      console.error('Error updating item order:', error);
      toast({
        title: "Erro ao atualizar ordem",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  const updateItemStatus = useCallback(async (itemId: string, status: AuctionItem['status']) => {
    try {
      const { error } = await supabase
        .from('auction_items')
        .update({ status })
        .eq('id', itemId);

      if (error) throw error;
      
      toast({
        title: "Status atualizado",
        description: "O status do lote foi atualizado com sucesso.",
      });
    } catch (error: any) {
      console.error('Error updating item status:', error);
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  return {
    items,
    loading,
    refetch: fetchItems,
    updateItemOrder,
    updateItemStatus,
  };
};