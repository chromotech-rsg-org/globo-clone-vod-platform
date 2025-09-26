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
  };
}

interface LimitRequest {
  id: string;
  user_id: string;
  current_limit: number;
  requested_limit: number;
  reason: string;
  status: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  user?: {
    name: string;
    email: string;
  };
  reviewer?: {
    name: string;
    email: string;
  };
}

export const useBidLimits = () => {
  const [limits, setLimits] = useState<BidLimit[]>([]);
  const [requests, setRequests] = useState<LimitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [systemSettings, setSystemSettings] = useState({
    minLimit: 1000,
    defaultLimit: 10000
  });

  const fetchLimits = async () => {
    try {
      const { data, error } = await supabase
        .from('client_bid_limits')
        .select(`
          *,
          user:profiles(name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLimits(data || []);
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
        .select(`
          *,
          user:profiles!limit_increase_requests_user_id_fkey(name, email),
          reviewer:profiles!limit_increase_requests_reviewed_by_fkey(name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching limit requests:', error);
      toast({
        title: "Erro ao carregar solicitações",
        description: "Não foi possível carregar as solicitações de aumento",
        variant: "destructive"
      });
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
      const { error } = await supabase
        .from('client_bid_limits')
        .upsert({
          user_id: userId,
          max_limit: maxLimit,
          is_unlimited: isUnlimited
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
      // Atualizar o status da solicitação
      const { data: request, error: requestError } = await supabase
        .from('limit_increase_requests')
        .update({
          status: approved ? 'approved' : 'rejected',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select('user_id, requested_limit')
        .single();

      if (requestError) throw requestError;

      // Se aprovado, atualizar o limite do usuário
      if (approved && request) {
        const limitToSet = newLimit || request.requested_limit;
        await createOrUpdateLimit(request.user_id, limitToSet);
      }
      
      toast({
        title: approved ? "Solicitação aprovada" : "Solicitação rejeitada",
        description: approved 
          ? "O limite do usuário foi atualizado com sucesso"
          : "A solicitação foi rejeitada"
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
        fetchSystemSettings()
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    limits,
    requests,
    loading,
    systemSettings,
    createOrUpdateLimit,
    requestLimitIncrease,
    reviewLimitRequest,
    getUserLimit,
    refetch: () => Promise.all([fetchLimits(), fetchRequests()])
  };
};