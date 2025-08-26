
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

export const useEnhancedAuctionBids = (auctionId: string) => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingBid, setSubmittingBid] = useState(false);
  const [pendingBidExists, setPendingBidExists] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const mounted = useRef(true);
  const retryCount = useRef(0);
  const maxRetries = 3;

  const fetchBids = useCallback(async () => {
    if (!auctionId || !mounted.current) return;

    console.log('🔄 Enhanced: Fetching bids for auction:', auctionId);
    
    try {
      const { data: bidsData, error: bidsError } = await supabase
        .from('bids')
        .select('id, user_id, auction_id, auction_item_id, bid_value, status, is_winner, created_at, updated_at, client_notes')
        .eq('auction_id', auctionId)
        .order('created_at', { ascending: false });

      if (bidsError) {
        console.error('❌ Enhanced: Error fetching bids:', bidsError);
        throw bidsError;
      }

      console.log('✅ Enhanced: Bids found:', bidsData?.length || 0);

      if (!mounted.current) return;

      let formattedBids: Bid[] = [];
      
      if (bidsData && bidsData.length > 0) {
        const userIds = [...new Set(bidsData.map(bid => bid.user_id))];
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds);

        if (profilesError) {
          console.warn('⚠️ Enhanced: Error fetching profiles:', profilesError);
        }

        const profilesMap = new Map(profilesData?.map(p => [p.id, p.name]) || []);

        formattedBids = bidsData.map((bid: any) => ({
          ...bid,
          user_name: profilesMap.get(bid.user_id) || `Usuário ${bid.user_id.slice(-4)}`
        }));
      }

      setBids(formattedBids);

      // Check for user's pending bid
      if (user?.id) {
        const userHasPendingBid = formattedBids.some((bid: Bid) => 
          bid.user_id === user.id && bid.status === 'pending'
        );
        setPendingBidExists(userHasPendingBid);
        console.log('🔍 Enhanced: User has pending bid?', userHasPendingBid);
      }

      retryCount.current = 0; // Reset retry count on success

    } catch (error) {
      console.error('💥 Enhanced: Error in fetchBids:', error);
      
      // Retry logic
      if (retryCount.current < maxRetries && mounted.current) {
        retryCount.current++;
        console.log(`🔄 Enhanced: Retrying bids fetch... (${retryCount.current}/${maxRetries})`);
        setTimeout(() => {
          if (mounted.current) {
            fetchBids();
          }
        }, 2000 * retryCount.current);
      } else if (mounted.current) {
        toast({
          title: "Erro",
          description: "Não foi possível carregar os lances",
          variant: "destructive"
        });
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, [auctionId, user, toast]);

  const submitBid = async (bidValue: number) => {
    if (!user || !auctionId) {
      toast({
        title: "Erro", 
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return false;
    }

    if (pendingBidExists) {
      toast({
        title: "Lance em análise",
        description: "Aguarde a análise do seu lance atual",
        variant: "destructive"
      });
      return false;
    }

    setSubmittingBid(true);

    try {
      // Double-check for pending bids
      const { data: existingBids } = await supabase
        .from('bids')
        .select('id')
        .eq('user_id', user.id)
        .eq('auction_id', auctionId)
        .eq('status', 'pending');

      if (existingBids && existingBids.length > 0) {
        toast({
          title: "Lance em análise",
          description: "Você já possui um lance aguardando análise",
          variant: "destructive"
        });
        return false;
      }

      // Get or create auction item
      let auctionItem;
      const { data: existingItem, error: itemError } = await supabase
        .from('auction_items')
        .select('id')
        .eq('auction_id', auctionId)
        .eq('is_current', true)
        .maybeSingle();

      if (itemError) {
        console.error('Error fetching auction item:', itemError);
        throw new Error('Não foi possível encontrar o item do leilão');
      }

      if (!existingItem) {
        const { data: auctionData } = await supabase
          .from('auctions')
          .select('name, description, initial_bid_value, current_bid_value')
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
              is_current: true,
              order_index: 0
            })
            .select('id')
            .single();

          if (createError) {
            console.error('Error creating auction item:', createError);
            throw new Error('Não foi possível criar o item do leilão');
          }
          auctionItem = newItem;
        } else {
          throw new Error('Leilão não encontrado');
        }
      } else {
        auctionItem = existingItem;
      }

      const { data, error } = await supabase
        .from('bids')
        .insert([{
          user_id: user.id,
          auction_id: auctionId,
          auction_item_id: auctionItem.id,
          bid_value: bidValue,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      toast({
        title: "Lance enviado",
        description: "Seu lance foi enviado para análise",
      });

      await fetchBids();
      return true;

    } catch (error: any) {
      console.error('Error submitting bid:', error);
      
      let errorMessage = "Não foi possível enviar o lance";
      if (error?.message?.includes('duplicate')) {
        errorMessage = "Você já possui um lance para este leilão";
      } else if (error?.message) {
        errorMessage = `Erro: ${error.message}`;
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    } finally {
      setSubmittingBid(false);
    }
  };

  useEffect(() => {
    if (!auctionId) return;
    
    mounted.current = true;
    fetchBids();

    // Enhanced real-time subscription with precise filtering
    const channelName = `enhanced-bids-${auctionId}-${user?.id || 'anon'}-${Date.now()}`;
    
    const handleBidsChange = (payload: any) => {
      console.log('🔔 Enhanced: Bid change detected:', payload);
      
      // Process all bid changes for this auction
      if (payload.new?.auction_id === auctionId || payload.old?.auction_id === auctionId) {
        console.log('✨ Enhanced: Processing relevant bid change');
        
        // Show toast for user's bid status changes (handled by global notifications)
        if (payload.new && payload.new.user_id === user?.id && payload.eventType === 'UPDATE') {
          const newStatus = payload.new.status;
          const oldStatus = payload.old?.status;
          
          if (newStatus !== oldStatus && ['approved', 'rejected'].includes(newStatus)) {
            console.log('📝 Enhanced: User bid status changed:', oldStatus, '->', newStatus);
            // Toast is handled by global notifications
          }
        }
        
        // Refresh bids for all changes
        fetchBids();
      }
    };

    let subscription: any;
    
    try {
      subscription = supabase
        .channel(channelName)
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
        .subscribe((status) => {
          console.log('📡 Enhanced: Bids subscription status:', status);
          
          // Reconnection logic
          if (status === 'CLOSED' && mounted.current) {
            console.log('🔌 Enhanced: Bids connection closed, setting up fallback polling');
            const pollInterval = setInterval(() => {
              if (mounted.current) {
                fetchBids();
              } else {
                clearInterval(pollInterval);
              }
            }, 15000); // Poll every 15 seconds as fallback
            
            setTimeout(() => {
              clearInterval(pollInterval);
            }, 60000); // Stop polling after 1 minute
          }
        });
        
    } catch (error) {
      console.error('❌ Enhanced: Error setting up bids subscription:', error);
      
      // Fallback to polling if realtime fails
      const pollInterval = setInterval(() => {
        if (mounted.current) {
          fetchBids();
        } else {
          clearInterval(pollInterval);
        }
      }, 20000); // Poll every 20 seconds
      
      return () => {
        clearInterval(pollInterval);
      };
    }

    return () => {
      mounted.current = false;
      if (subscription) {
        console.log('🔌 Enhanced: Removing bids subscription');
        supabase.removeChannel(subscription);
      }
    };
  }, [auctionId, fetchBids, user?.id]);

  const userPendingBid = bids.find(bid => bid.user_id === user?.id && bid.status === 'pending');

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
