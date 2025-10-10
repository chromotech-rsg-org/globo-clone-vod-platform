import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface BidLimit {
  id: string;
  user_id: string;
  max_limit: number;
  is_unlimited: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  user?: {
    name: string;
    email: string;
  } | null;
}

interface LimitRequest {
  id: string;
  user_id: string;
  current_limit: number;
  requested_limit: number;
  reason: string | null;
  status: string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
  auction_name?: string | null;
  lot_name?: string | null;
  user?: {
    name: string;
    email: string;
  } | null;
  reviewer?: {
    name: string;
    email: string;
  } | null;
}

interface FailedBidAttempt {
  id: string;
  user_id: string;
  auction_id: string;
  auction_item_id: string;
  attempted_bid_value: number;
  current_limit: number;
  total_bids_at_attempt: number;
  reason: string;
  created_at: string;
  auction?: {
    name: string;
  } | null;
  auction_item?: {
    name: string;
  } | null;
  user?: {
    name: string;
    email: string;
  } | null;
}

export const useBidLimits = () => {
  const [limits, setLimits] = useState<BidLimit[]>([]);
  const [requests, setRequests] = useState<LimitRequest[]>([]);
  const [failedAttempts, setFailedAttempts] = useState<FailedBidAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [systemSettings, setSystemSettings] = useState({
    minLimit: 1000,
    defaultLimit: 10000
  });

  const fetchLimits = async () => {
    try {
      const { data, error } = await supabase
        .from('client_bid_limits')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user names separately
      const limitsWithUsers = await Promise.all((data || []).map(async (limit) => {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', limit.user_id)
          .single();
        return { ...limit, user: userProfile };
      }));

      setLimits(limitsWithUsers);
    } catch (error) {
      console.error('Error fetching bid limits:', error);
      toast({
        title: "Erro ao carregar limites",
        description: "Não foi possível carregar os limites de lance",
        variant: "destructive"
      });
    }
  };

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('limit_increase_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user, reviewer, auction and lot info separately
      const requestsWithUsers = await Promise.all((data || []).map(async (request) => {
        const [userProfile, reviewerProfile] = await Promise.all([
          supabase.from('profiles').select('name, email').eq('id', request.user_id).single(),
          request.reviewed_by 
            ? supabase.from('profiles').select('name, email').eq('id', request.reviewed_by).single()
            : Promise.resolve({ data: null })
        ]);

        // Buscar a tentativa de lance mais recente do usuário para encontrar leilão e lote
        const { data: recentAttempt } = await supabase
          .from('failed_bid_attempts')
          .select('auction_id, auction_item_id')
          .eq('user_id', request.user_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        let auctionName = null;
        let lotName = null;

        if (recentAttempt) {
          const [auctionData, lotData] = await Promise.all([
            supabase.from('auctions').select('name').eq('id', recentAttempt.auction_id).maybeSingle(),
            supabase.from('auction_items').select('name').eq('id', recentAttempt.auction_item_id).maybeSingle()
          ]);
          
          auctionName = auctionData.data?.name || null;
          lotName = lotData.data?.name || null;
        }
        
        return { 
          ...request, 
          user: userProfile.data,
          reviewer: reviewerProfile.data,
          auction_name: auctionName,
          lot_name: lotName
        };
      }));

      setRequests(requestsWithUsers);
    } catch (error) {
      console.error('Error fetching limit requests:', error);
      toast({
        title: "Erro ao carregar solicitações",
        description: "Não foi possível carregar as solicitações de aumento",
        variant: "destructive"
      });
    }
  };

  const fetchFailedAttempts = async () => {
    try {
      const { data, error } = await supabase
        .from('failed_bid_attempts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch auction, item and user names separately
      const attemptsWithDetails = await Promise.all((data || []).map(async (attempt) => {
        const [auctionData, itemData, userData] = await Promise.all([
          supabase.from('auctions').select('name').eq('id', attempt.auction_id).single(),
          supabase.from('auction_items').select('name').eq('id', attempt.auction_item_id).single(),
          supabase.from('profiles').select('name, email').eq('id', attempt.user_id).single()
        ]);
        
        return {
          ...attempt,
          auction: auctionData.data,
          auction_item: itemData.data,
          user: userData.data
        };
      }));

      setFailedAttempts(attemptsWithDetails);
    } catch (error) {
      console.error('Error fetching failed attempts:', error);
    }
  };

  const fetchSystemSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['min_bid_limit', 'default_bid_limit']);

      if (error) throw error;
      
      const settings = data?.reduce((acc, setting) => {
        if (setting.key === 'min_bid_limit') acc.minLimit = parseInt(setting.value);
        if (setting.key === 'default_bid_limit') acc.defaultLimit = parseInt(setting.value);
        return acc;
      }, { minLimit: 1000, defaultLimit: 10000 });

      setSystemSettings(settings || { minLimit: 1000, defaultLimit: 10000 });
    } catch (error) {
      console.error('Error fetching system settings:', error);
    }
  };

  const createOrUpdateLimit = async (userId: string, maxLimit: number, isUnlimited: boolean = false) => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('client_bid_limits')
        .upsert({
          user_id: userId,
          max_limit: maxLimit,
          is_unlimited: isUnlimited,
          created_by: currentUser.user.id
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      
      toast({
        title: "Limite atualizado",
        description: "Limite de lance atualizado com sucesso"
      });
      
      await fetchLimits();
    } catch (error) {
      console.error('Error updating bid limit:', error);
      toast({
        title: "Erro ao atualizar limite",
        description: "Não foi possível atualizar o limite de lance",
        variant: "destructive"
      });
    }
  };

  const requestLimitIncrease = async (userId: string, currentLimit: number, requestedLimit: number, reason: string) => {
    try {
      const { error } = await supabase
        .from('limit_increase_requests')
        .insert({
          user_id: userId,
          current_limit: currentLimit,
          requested_limit: requestedLimit,
          reason: reason,
          status: 'pending'
        });

      if (error) throw error;
      
      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação de aumento de limite foi enviada para análise"
      });
      
      await fetchRequests();
    } catch (error) {
      console.error('Error requesting limit increase:', error);
      toast({
        title: "Erro ao solicitar aumento",
        description: "Não foi possível enviar a solicitação",
        variant: "destructive"
      });
    }
  };

  const reviewLimitRequest = async (requestId: string, approved: boolean, newLimit?: number) => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('User not authenticated');

      // Buscar a solicitação completa para obter user_id e auction_id
      const { data: fullRequest, error: fetchError } = await supabase
        .from('limit_increase_requests')
        .select('user_id, requested_limit, current_limit')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;

      // Limites são globais, não específicos de um leilão
      // Deixar auction_id como null para que apareça em todos os leilões
      const auctionId: string | null = null;

      // Atualizar o status da solicitação
      const { data: request, error: requestError } = await supabase
        .from('limit_increase_requests')
        .update({
          status: approved ? 'approved' : 'rejected',
          reviewed_by: currentUser.user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select('user_id, requested_limit')
        .single();

      if (requestError) throw requestError;

      // Se aprovado, atualizar o limite do usuário
      const limitToSet = approved && request ? (newLimit || request.requested_limit) : fullRequest.current_limit;
      if (approved && request) {
        await createOrUpdateLimit(request.user_id, limitToSet);
      }

      // Criar notificação para o usuário
      const notificationMessage = approved 
        ? `Sua solicitação de aumento de limite foi aprovada! Novo limite: R$ ${limitToSet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        : `Sua solicitação de aumento de limite foi rejeitada. Seu limite atual permanece em R$ ${fullRequest.current_limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

      const { error: notificationError } = await supabase
        .from('limit_request_responses')
        .insert({
          request_id: requestId,
          user_id: fullRequest.user_id,
          auction_id: auctionId,
          status: approved ? 'approved' : 'rejected',
          new_limit: limitToSet,
          reviewed_by: currentUser.user.id,
          client_notes: notificationMessage
        });

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
      }
      
      toast({
        title: approved ? "Solicitação aprovada" : "Solicitação rejeitada",
        description: approved 
          ? "O limite do usuário foi atualizado e ele foi notificado"
          : "A solicitação foi rejeitada e o usuário foi notificado"
      });
      
      await fetchRequests();
    } catch (error) {
      console.error('Error reviewing limit request:', error);
      toast({
        title: "Erro ao revisar solicitação",
        description: "Não foi possível processar a solicitação",
        variant: "destructive"
      });
    }
  };

  const updateMinLimit = async (newMinLimit: number) => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: 'min_bid_limit',
          value: newMinLimit.toString(),
          description: 'Limite mínimo de lance que pode ser definido para clientes'
        }, {
          onConflict: 'key'
        });

      if (error) throw error;
      
      toast({
        title: "Limite mínimo atualizado",
        description: `Limite mínimo definido para ${newMinLimit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
      });
      
      await fetchSystemSettings();
    } catch (error) {
      console.error('Error updating min limit:', error);
      toast({
        title: "Erro ao atualizar limite mínimo",
        description: "Não foi possível atualizar o limite mínimo",
        variant: "destructive"
      });
      throw error;
    }
  };

  const getUserLimit = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('client_bid_limits')
        .select('max_limit, is_unlimited')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data || { max_limit: systemSettings.defaultLimit, is_unlimited: false };
    } catch (error) {
      console.error('Error fetching user limit:', error);
      return { max_limit: systemSettings.defaultLimit, is_unlimited: false };
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchLimits(),
        fetchRequests(),
        fetchFailedAttempts(),
        fetchSystemSettings()
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    limits,
    requests,
    failedAttempts,
    loading,
    systemSettings,
    createOrUpdateLimit,
    requestLimitIncrease,
    reviewLimitRequest,
    getUserLimit,
    updateMinLimit,
    refetch: () => Promise.all([fetchLimits(), fetchRequests(), fetchFailedAttempts(), fetchSystemSettings()])
  };
};