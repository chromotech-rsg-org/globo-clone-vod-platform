import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface Bid {
  id: string;
  user_id: string;
  auction_id: string;
  auction_item_id: string;
  bid_value: number;
  status: 'approved' | 'pending' | 'rejected' | 'superseded';
  internal_notes?: string;
  client_notes?: string;
  approved_by?: string;
  is_winner: boolean;
  created_at: string;
  updated_at: string;
  user_name?: string;
}

export const useAuctionBids = (auctionId: string) => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingBid, setSubmittingBid] = useState(false);
  const [pendingBidExists, setPendingBidExists] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const mounted = useRef(true);

  const fetchBids = useCallback(async () => {
    if (!auctionId || !mounted.current) return;

    console.log('🔄 useAuctionBids: Iniciando busca de lances para:', auctionId);
    
    try {
      // Query específica para lances
      const { data: bidsData, error: bidsError } = await supabase
        .from('bids')
        .select('id, user_id, auction_id, auction_item_id, bid_value, status, is_winner, created_at, updated_at, client_notes')
        .eq('auction_id', auctionId)
        .order('created_at', { ascending: false });

      if (bidsError) {
        console.error('❌ useAuctionBids: Erro ao buscar lances:', bidsError);
        setBids([]);
        setLoading(false);
        return;
      }

      console.log('✅ useAuctionBids: Lances encontrados:', bidsData?.length || 0);

      if (!mounted.current) return;

      // Processar lances
      let formattedBids: Bid[] = [];
      
      if (bidsData && bidsData.length > 0) {
        // Buscar nomes dos usuários separadamente
        const userIds = [...new Set(bidsData.map(bid => bid.user_id))];
        console.log('👥 useAuctionBids: Buscando perfis para:', userIds.length, 'usuários');
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds);

        if (profilesError) {
          console.warn('⚠️ useAuctionBids: Erro ao buscar perfis:', profilesError);
        }

        console.log('👤 useAuctionBids: Perfis encontrados:', profilesData?.length || 0);

        const profilesMap = new Map(profilesData?.map(p => [p.id, p.name]) || []);

        formattedBids = bidsData.map((bid: any) => ({
          ...bid,
          user_name: profilesMap.get(bid.user_id) || `Usuário ${bid.user_id.slice(-4)}`
        }));

        console.log('📋 useAuctionBids: Lances formatados:', formattedBids.length);
      }

      setBids(formattedBids);

      // Como os lances são aprovados automaticamente, não há mais lances pendentes
      setPendingBidExists(false);
      console.log('🔍 useAuctionBids: Sistema de aprovação automática ativo');

    } catch (error) {
      console.error('💥 useAuctionBids: Erro geral:', error);
      setBids([]);
      if (mounted.current) {
        toast({
          title: "Erro",
          description: "Não foi possível carregar os lances",
          variant: "destructive"
        });
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
        console.log('✨ useAuctionBids: Busca finalizada');
      }
    }
  }, [auctionId, user, toast]);

  const submitBid = async (bidValue: number, lotId?: string): Promise<{ success: boolean; requiredMin?: number; message?: string }> => {
    if (!user || !auctionId) {
      const message = "Usuário não autenticado";
      toast({
        title: "Erro", 
        description: message,
        variant: "destructive"
      });
      return { success: false, message };
    }

    // Como os lances são aprovados automaticamente, removemos a verificação de pending

    setSubmittingBid(true);

    // Helper para extrair valor sugerido do erro do servidor
    const parseSuggestedValueFromError = (msg?: string): number | undefined => {
      if (!msg) return undefined;
      // Procura por um valor sugerido após "Sugestão: R$"
      // Ex.: "O valor do lance deve ser pelo menos R$ 520,000.00 (valor atual + incremento). Sugestão: R$ 520,000.00"
      const match = msg.match(/Sugestão:\s*R\$\s*([\d.,]+)/i) || msg.match(/pelo menos\s*R\$\s*([\d.,]+)/i);
      const raw = match?.[1];
      if (!raw) return undefined;
      // Remove tudo que não é dígito e assume 2 casas decimais
      const digits = raw.replace(/[^\d]/g, "");
      if (!digits) return undefined;
      const value = Number(digits) / 100; // funciona tanto para 520,000.00 quanto 520.000,00
      return isNaN(value) ? undefined : value;
    };

    try {
      // Como os lances são aprovados automaticamente, não precisamos verificar pending

      // Buscar item atual do leilão (preferindo is_current ou status in_progress)
      // Se lotId específico foi fornecido (pré-lance), usar esse lote
      type ExistingItem = { id: string; current_value: number; increment: number | null; status: string; is_current: boolean };
      let auctionItem: ExistingItem;
      let lotStatus: string = 'not_started';

      if (lotId) {
        // Buscar lote específico para pré-lance
        const { data: specificItem, error: specificItemError } = await supabase
          .from('auction_items')
          .select('id, current_value, increment, status, is_current')
          .eq('id', lotId)
          .eq('auction_id', auctionId)
          .single();

        if (specificItemError || !specificItem) {
          console.error('Error fetching specific auction item:', specificItemError);
          throw new Error('Não foi possível encontrar o lote especificado');
        }

        auctionItem = specificItem as ExistingItem;
        lotStatus = specificItem.status;
      } else {
        // Lógica original para lotes ativos
        const { data: existingItem, error: itemError } = await supabase
          .from('auction_items')
          .select('id, current_value, increment, status, is_current')
          .eq('auction_id', auctionId)
          .or('is_current.eq.true,status.eq.in_progress')
          .order('is_current', { ascending: false })
          .order('order_index', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (itemError) {
          console.error('Error fetching auction item:', itemError);
          throw new Error('Não foi possível encontrar o item do leilão');
        }

        if (!existingItem) {
          // Criar um item padrão se não existir
          const { data: auctionData } = await supabase
            .from('auctions')
            .select('name, description, initial_bid_value, current_bid_value, bid_increment')
            .eq('id', auctionId)
            .single();

          if (auctionData) {
            const { data: newItem, error: createError } = await supabase
              .from('auction_items')
              .insert({
                auction_id: auctionId,
                name: auctionData.name,
                description: auctionData.description || 'Item principal do leilão',
                initial_value: auctionData.initial_bid_value,
                current_value: auctionData.current_bid_value,
                increment: null, // usa incremento do leilão por padrão
                is_current: true,
                order_index: 0
              })
              .select('id, current_value, increment, status, is_current')
              .single();

            if (createError) {
              console.error('Error creating auction item:', createError);
              throw new Error('Não foi possível criar o item do leilão');
            }
            auctionItem = newItem as ExistingItem;
          } else {
            throw new Error('Leilão não encontrado');
          }
        } else {
          auctionItem = existingItem as ExistingItem;
          lotStatus = existingItem.status;
        }
      }

      // Validar valor mínimo do lance com dados atualizados do servidor
      const { data: auctionRow } = await supabase
        .from('auctions')
        .select('bid_increment')
        .eq('id', auctionId)
        .single();

      // Obter o maior lance aprovado para este lote
      const { data: highestBidData } = await supabase
        .from('bids')
        .select('bid_value')
        .eq('auction_item_id', auctionItem.id)
        .eq('status', 'approved')
        .order('bid_value', { ascending: false })
        .limit(1)
        .maybeSingle();

      const highestApprovedBid = highestBidData?.bid_value || 0;
      const currentValue = Math.max(Number(auctionItem.current_value), Number(highestApprovedBid));
      const incrementToUse = Number(auctionItem.increment ?? auctionRow?.bid_increment ?? 100);
      const minAllowed = currentValue + incrementToUse;

      if (bidValue < minAllowed) {
        const message = `O lance mínimo atual é R$ ${minAllowed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`;
        toast({
          title: "Valor de lance insuficiente",
          description: message,
          variant: "destructive"
        });
        return { success: false, message };
      }

      // Determine bid origin based on lot status
      const bidOrigin = lotStatus === 'pre_bidding' ? 'pre_bidding' : 'live';
      
      const { data, error } = await supabase
        .from('bids')
        .insert([{
          user_id: user.id,
          auction_id: auctionId,
          auction_item_id: auctionItem.id,
          bid_value: bidValue,
          status: 'pending',
          bid_origin: bidOrigin,
          lot_status_at_bid: lotStatus
        }])
        .select()
        .single();
      
      console.log('📝 Bid inserted with origin:', { bidOrigin, lotStatus });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      toast({
        title: "Lance aprovado!",
        description: "Seu lance foi aprovado automaticamente",
      });

      await fetchBids();
      return { success: true };

    } catch (error: any) {
      console.error('Error submitting bid:', error);
      
      // Handle unique constraint violation (duplicate bid value)
      if (error?.code === '23505' || error?.message?.includes('unique_auction_item_bid_value')) {
        return { 
          success: false, 
          message: "Um lance com esse valor já foi recebido. Tente um valor maior."
        };
      }
      
      const suggestedMin = parseSuggestedValueFromError(error?.message);
      let description = "Não foi possível enviar o lance";
      if (error?.message?.includes('duplicate')) {
        description = "Você já possui um lance para este leilão";
      } else if (error?.message) {
        description = `Erro: ${error.message}`;
      }

      // Only show toast for non-duplicate bid value errors and when there's no suggested value
      if (!suggestedMin && error?.code !== '23505') {
        toast({
          title: "Erro",
          description,
          variant: "destructive"
        });
      }

      return { success: false, requiredMin: suggestedMin, message: description };
    } finally {
      setSubmittingBid(false);
    }
  };

  useEffect(() => {
    if (!auctionId) return;
    
    mounted.current = true;
    fetchBids();

    // Real-time subscription for bid updates
    const handleBidsChange = (payload: any) => {
      if (mounted.current) {
        // Show toast for user's winning bid status changes
        if (payload.new && payload.new.user_id === user?.id && payload.eventType === 'UPDATE') {
          if (payload.new.is_winner && !payload.old?.is_winner) {
            toast({
              title: "🏆 Parabéns!",
              description: "Você ganhou o lote com seu lance!",
            });
          } else if (payload.new.status === 'rejected') {
            toast({
              title: "Lance Rejeitado",
              description: payload.new.client_notes || "Seu lance foi rejeitado.",
              variant: "destructive"
            });
          }
        }
        
        fetchBids();
      }
    };

    const channel = supabase
      .channel(`auction-bids-${auctionId}-${Math.random().toString(36).substring(7)}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bids',
        filter: `auction_id=eq.${auctionId}`
      }, handleBidsChange)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'auctions',
        filter: `id=eq.${auctionId}`
      }, handleBidsChange)
      .subscribe();

    return () => {
      mounted.current = false;
      supabase.removeChannel(channel);
    };
  }, [auctionId, fetchBids, user?.id, toast]);

  const userPendingBid = null; // Como os lances são aprovados automaticamente, não há pending

  return {
    bids,
    loading,
    submitBid,
    submittingBid,
    pendingBidExists,
    userPendingBid,
    refetch: fetchBids
  };
};