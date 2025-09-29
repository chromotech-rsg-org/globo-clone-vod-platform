import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  total_users: number;
  total_auctions: number;
  total_bids: number;
  total_revenue: number;
  active_auctions: number;
  pending_registrations: number;
  documents_count: number;
  limit_requests_pending: number;
}

interface FinancialStats {
  monthly_revenue: Array<{ month: string; revenue: number }>;
  top_bidders: Array<{ user_name: string; total_bids: number; total_value: number }>;
  auction_performance: Array<{ auction_name: string; total_lots: number; finished_lots: number; total_revenue: number }>;
  recent_winners: Array<{ user_name: string; auction_name: string; lot_name: string; winning_bid: number; date: string }>;
}

interface InsightStats {
  potential_clients: Array<{ user_name: string; participation_count: number; last_bid_date: string; avg_bid_value: number }>;
  loyal_clients: Array<{ user_name: string; auctions_participated: number; total_bids: number; win_rate: number }>;
  missed_opportunities: Array<{ user_name: string; auction_name: string; lot_name: string; last_bid: number; winning_bid: number; difference: number }>;
  bid_trends: Array<{ date: string; total_bids: number; avg_bid_value: number }>;
}

export const useDashboardStats = () => {
  const [generalStats, setGeneralStats] = useState<DashboardStats | null>(null);
  const [financialStats, setFinancialStats] = useState<FinancialStats | null>(null);
  const [insightStats, setInsightStats] = useState<InsightStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGeneralStats = async () => {
    try {
      // Fetch stats manually since get_dashboard_stats function might not exist
      const [
        { count: totalUsers },
        { count: totalAuctions },
        { count: totalBids },
        { count: activeAuctions },
        { count: pendingRegistrations },
        { count: documentsCount },
        { count: limitRequestsPending }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('auctions').select('*', { count: 'exact', head: true }),
        supabase.from('bids').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('auctions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('auction_registrations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('client_documents').select('*', { count: 'exact', head: true }),
        supabase.from('limit_increase_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      ]);

      // Calculate total revenue
      const { data: winnerBids } = await supabase
        .from('bids')
        .select('bid_value')
        .eq('is_winner', true)
        .eq('status', 'approved');

      const totalRevenue = winnerBids?.reduce((sum, bid) => sum + Number(bid.bid_value), 0) || 0;

      setGeneralStats({
        total_users: totalUsers || 0,
        total_auctions: totalAuctions || 0,
        total_bids: totalBids || 0,
        total_revenue: totalRevenue,
        active_auctions: activeAuctions || 0,
        pending_registrations: pendingRegistrations || 0,
        documents_count: documentsCount || 0,
        limit_requests_pending: limitRequestsPending || 0
      });
    } catch (err) {
      console.error('Error fetching general stats:', err);
      throw err;
    }
  };

  const fetchFinancialStats = async () => {
    try {
      // Receita mensal dos últimos 12 meses
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('bids')
        .select('bid_value, created_at')
        .eq('is_winner', true)
        .eq('status', 'approved')
        .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());

      if (monthlyError) throw monthlyError;

      // Processar dados mensais
      const monthlyRevenue = processMonthlyRevenue(monthlyData || []);

      // Top arrematantes
      const { data: topBiddersData, error: biddersError } = await supabase
        .from('bids')
        .select(`
          user_id, 
          bid_value
        `)
        .eq('is_winner', true)
        .eq('status', 'approved');

      if (biddersError) throw biddersError;

      // Fetch user names separately for top bidders
      const biddersWithNames = await Promise.all((topBiddersData || []).map(async (bid) => {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', bid.user_id)
          .single();
        return { ...bid, profiles: userProfile };
      }));

      const topBidders = processTopBidders(biddersWithNames || []);

      // Performance dos leilões
      const { data: auctionData, error: auctionError } = await supabase
        .from('auctions')
        .select(`
          id,
          name,
          auction_items(id, status),
          bids(bid_value, is_winner, status)
        `);

      if (auctionError) throw auctionError;

      const auctionPerformance = processAuctionPerformance(auctionData || []);

      // Arrematações recentes
      const { data: recentWinners, error: winnersError } = await supabase
        .from('bids')
        .select(`
          bid_value,
          created_at,
          user_id,
          auction_id,
          auction_item_id
        `)
        .eq('is_winner', true)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(10);

      if (winnersError) throw winnersError;

      // Fetch related data separately
      const recentWinnersProcessed = await Promise.all((recentWinners || []).map(async (winner) => {
        const [userProfile, auction, auctionItem] = await Promise.all([
          supabase.from('profiles').select('name').eq('id', winner.user_id).single(),
          supabase.from('auctions').select('name').eq('id', winner.auction_id).single(),
          supabase.from('auction_items').select('name').eq('id', winner.auction_item_id).single()
        ]);
        
        return {
          user_name: userProfile.data?.name || 'Usuário Desconhecido',
          auction_name: auction.data?.name || 'Leilão Desconhecido',
          lot_name: auctionItem.data?.name || 'Lote Desconhecido',
          winning_bid: winner.bid_value,
          date: winner.created_at
        };
      }));

      setFinancialStats({
        monthly_revenue: monthlyRevenue,
        top_bidders: topBidders,
        auction_performance: auctionPerformance,
        recent_winners: recentWinnersProcessed
      });
    } catch (err) {
      console.error('Error fetching financial stats:', err);
      throw err;
    }
  };

  const fetchInsightStats = async () => {
    try {
      // Clientes potenciais (participaram mas não arremataram muito)
      const { data: potentialData, error: potentialError } = await supabase
        .from('bids')
        .select(`
          user_id,
          bid_value,
          created_at,
          is_winner,
          profiles!bids_user_id_fkey(name)
        `)
        .eq('status', 'approved');

      if (potentialError) throw potentialError;

      const potentialClients = processPotentialClients(potentialData || []);

      // Clientes fidelizados
      const { data: loyalData, error: loyalError } = await supabase
        .from('auction_registrations')
        .select(`
          user_id,
          auction_id,
          profiles(name),
          bids(is_winner, status)
        `)
        .eq('status', 'approved');

      if (loyalError) throw loyalError;

      const loyalClients = processLoyalClients(loyalData || []);

      // Oportunidades perdidas (penúltimo lance)
      const { data: missedData, error: missedError } = await supabase
        .from('bids')
        .select(`
          user_id,
          auction_item_id,
          bid_value,
          is_winner,
          profiles!bids_user_id_fkey(name),
          auctions(name),
          auction_items(name)
        `)
        .eq('status', 'approved')
        .order('auction_item_id')
        .order('bid_value', { ascending: false });

      if (missedError) throw missedError;

      const missedOpportunities = processMissedOpportunities(missedData || []);

      // Tendências de lances
      const { data: trendData, error: trendError } = await supabase
        .from('bids')
        .select('bid_value, created_at')
        .eq('status', 'approved')
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at');

      if (trendError) throw trendError;

      const bidTrends = processBidTrends(trendData || []);

      setInsightStats({
        potential_clients: potentialClients,
        loyal_clients: loyalClients,
        missed_opportunities: missedOpportunities,
        bid_trends: bidTrends
      });
    } catch (err) {
      console.error('Error fetching insight stats:', err);
      throw err;
    }
  };

  // Funções de processamento de dados
  const processMonthlyRevenue = (data: any[]) => {
    const monthlyMap = new Map();
    data.forEach(bid => {
      const date = new Date(bid.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + bid.bid_value);
    });

    return Array.from(monthlyMap.entries())
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);
  };

  const processTopBidders = (data: any[]) => {
    const bidderMap = new Map();
    data.forEach(bid => {
      const userName = bid.profiles?.name || 'Usuário Desconhecido';
      if (!bidderMap.has(bid.user_id)) {
        bidderMap.set(bid.user_id, {
          user_name: userName,
          total_bids: 0,
          total_value: 0
        });
      }
      const bidder = bidderMap.get(bid.user_id);
      bidder.total_bids += 1;
      bidder.total_value += Number(bid.bid_value);
    });

    return Array.from(bidderMap.values())
      .sort((a, b) => b.total_value - a.total_value)
      .slice(0, 10);
  };

  const processAuctionPerformance = (data: any[]) => {
    return data.map(auction => ({
      auction_name: auction.name,
      total_lots: auction.auction_items?.length || 0,
      finished_lots: auction.auction_items?.filter((item: any) => item.status === 'finished').length || 0,
      total_revenue: auction.bids?.filter((bid: any) => bid.is_winner && bid.status === 'approved').reduce((sum: number, bid: any) => sum + bid.bid_value, 0) || 0
    })).filter(auction => auction.total_lots > 0);
  };

  const processPotentialClients = (data: any[]) => {
    const clientMap = new Map();
    data.forEach(bid => {
      const userName = bid.profiles?.name || 'Usuário Desconhecido';
      if (!clientMap.has(bid.user_id)) {
        clientMap.set(bid.user_id, {
          user_name: userName,
          participation_count: 0,
          last_bid_date: bid.created_at,
          total_bid_value: 0,
          wins: 0
        });
      }
      const client = clientMap.get(bid.user_id);
      client.participation_count += 1;
      client.total_bid_value += bid.bid_value;
      if (bid.is_winner) client.wins += 1;
      if (bid.created_at > client.last_bid_date) {
        client.last_bid_date = bid.created_at;
      }
    });

    return Array.from(clientMap.values())
      .map(client => ({
        user_name: client.user_name,
        participation_count: client.participation_count,
        last_bid_date: client.last_bid_date,
        avg_bid_value: client.total_bid_value / client.participation_count
      }))
      .filter(client => client.participation_count >= 3) // Clientes que participaram pelo menos 3 vezes
      .sort((a, b) => b.participation_count - a.participation_count)
      .slice(0, 20);
  };

  const processLoyalClients = (data: any[]) => {
    const clientMap = new Map();
    data.forEach(registration => {
      const userName = registration.profiles?.name || 'Usuário Desconhecido';
      if (!clientMap.has(registration.user_id)) {
        clientMap.set(registration.user_id, {
          user_name: userName,
          auctions_participated: 0,
          total_bids: 0,
          wins: 0
        });
      }
      const client = clientMap.get(registration.user_id);
      client.auctions_participated += 1;
      if (registration.bids) {
        client.total_bids += registration.bids.length;
        client.wins += registration.bids.filter((bid: any) => bid.is_winner && bid.status === 'approved').length;
      }
    });

    return Array.from(clientMap.values())
      .map(client => ({
        user_name: client.user_name,
        auctions_participated: client.auctions_participated,
        total_bids: client.total_bids,
        win_rate: client.total_bids > 0 ? (client.wins / client.total_bids) * 100 : 0
      }))
      .filter(client => client.auctions_participated >= 2)
      .sort((a, b) => b.auctions_participated - a.auctions_participated)
      .slice(0, 15);
  };

  const processMissedOpportunities = (data: any[]) => {
    const opportunities = [];
    const itemGroups = new Map();

    // Agrupar lances por item
    data.forEach(bid => {
      if (!itemGroups.has(bid.auction_item_id)) {
        itemGroups.set(bid.auction_item_id, []);
      }
      itemGroups.get(bid.auction_item_id).push(bid);
    });

    // Processar cada grupo para encontrar oportunidades perdidas
    itemGroups.forEach(bids => {
      const sortedBids = bids.sort((a: any, b: any) => b.bid_value - a.bid_value);
      if (sortedBids.length >= 2) {
        const winningBid = sortedBids.find((bid: any) => bid.is_winner);
        const secondBid = sortedBids[1];
        
        if (winningBid && secondBid && !secondBid.is_winner) {
          opportunities.push({
            user_name: secondBid.profiles?.name || 'Usuário Desconhecido',
            auction_name: secondBid.auctions?.name || 'Leilão Desconhecido',
            lot_name: secondBid.auction_items?.name || 'Lote Desconhecido',
            last_bid: secondBid.bid_value,
            winning_bid: winningBid.bid_value,
            difference: winningBid.bid_value - secondBid.bid_value
          });
        }
      }
    });

    return opportunities
      .sort((a, b) => a.difference - b.difference)
      .slice(0, 20);
  };

  const processBidTrends = (data: any[]) => {
    const dailyMap = new Map();
    data.forEach(bid => {
      const date = new Date(bid.created_at).toISOString().split('T')[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { total_bids: 0, total_value: 0 });
      }
      const day = dailyMap.get(date);
      day.total_bids += 1;
      day.total_value += bid.bid_value;
    });

    return Array.from(dailyMap.entries())
      .map(([date, stats]) => ({
        date,
        total_bids: stats.total_bids,
        avg_bid_value: stats.total_value / stats.total_bids
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const fetchAllStats = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([
        fetchGeneralStats(),
        fetchFinancialStats(),
        fetchInsightStats()
      ]);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllStats();
  }, []);

  return {
    generalStats,
    financialStats,
    insightStats,
    loading,
    error,
    refetch: fetchAllStats
  };
};