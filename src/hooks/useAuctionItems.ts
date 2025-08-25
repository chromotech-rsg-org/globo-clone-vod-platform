
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface AuctionItem {
  id: string;
  auction_id: string;
  name: string;
  description?: string;
  image_url?: string;
  initial_value: number;
  current_value: number;
  is_current: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export const useAuctionItems = (auctionId: string) => {
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [currentItem, setCurrentItem] = useState<AuctionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchItems = useCallback(async () => {
    if (!auctionId) return;

    try {
      const { data, error } = await supabase
        .from('auction_items')
        .select('*')
        .eq('auction_id', auctionId)
        .order('order_index', { ascending: true });

      if (error) throw error;

      const itemsList = data as AuctionItem[] || [];
      setItems(itemsList);
      
      const current = itemsList.find(item => item.is_current);
      setCurrentItem(current || null);
      
    } catch (error) {
      console.error('Error fetching auction items:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os itens do leilão",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [auctionId, toast]);

  const addItem = async (itemData: Partial<AuctionItem>) => {
    try {
      const maxOrder = Math.max(...items.map(item => item.order_index), -1);
      
      const { data, error } = await supabase
        .from('auction_items')
        .insert({
          auction_id: auctionId,
          name: itemData.name || 'Novo Item',
          description: itemData.description || '',
          image_url: itemData.image_url || '',
          initial_value: itemData.initial_value || 0,
          current_value: itemData.current_value || itemData.initial_value || 0,
          is_current: items.length === 0, // First item is current
          order_index: maxOrder + 1
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Item adicionado ao leilão"
      });

      fetchItems();
      return data;
    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o item",
        variant: "destructive"
      });
    }
  };

  const updateItem = async (itemId: string, updates: Partial<AuctionItem>) => {
    try {
      const { error } = await supabase
        .from('auction_items')
        .update(updates)
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Item atualizado"
      });

      fetchItems();
    } catch (error) {
      console.error('Error updating item:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o item",
        variant: "destructive"
      });
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('auction_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Item removido do leilão"
      });

      fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o item",
        variant: "destructive"
      });
    }
  };

  const setCurrentItemById = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('auction_items')
        .update({ is_current: true })
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Item atual alterado"
      });

      fetchItems();
    } catch (error) {
      console.error('Error setting current item:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o item atual",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (auctionId) {
      fetchItems();

      // Real-time subscription for auction items
      const subscription = supabase
        .channel(`auction-items-${auctionId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'auction_items',
          filter: `auction_id=eq.${auctionId}`
        }, () => {
          fetchItems();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [auctionId, fetchItems]);

  return {
    items,
    currentItem,
    loading,
    addItem,
    updateItem,
    deleteItem,
    setCurrentItemById,
    refetch: fetchItems
  };
};
