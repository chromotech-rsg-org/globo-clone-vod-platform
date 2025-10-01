import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { Check, X, TrendingUp, AlertCircle, User, DollarSign, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Bid {
  id: string;
  bid_value: number;
  status: string;
  created_at: string;
  auction_item: {
    name: string;
  };
  auctions: {
    name: string;
  };
}

interface FailedAttempt {
  id: string;
  attempted_bid_value: number;
  current_limit: number;
  total_bids_at_attempt: number;
  created_at: string;
  auction: {
    name: string;
  };
  auction_item: {
    name: string;
  };
}

interface ReviewRequestModalProps {
  request: {
    id: string;
    user_id: string;
    current_limit: number;
    requested_limit: number;
    reason: string | null;
    auction_name?: string | null;
    lot_name?: string | null;
    user?: {
      name: string;
      email: string;
    };
  };
  onApprove: () => void;
  onReject: () => void;
}

export function ReviewRequestModal({ request, onApprove, onReject }: ReviewRequestModalProps) {
  const [bids, setBids] = useState<Bid[]>([]);
  const [failedAttempts, setFailedAttempts] = useState<FailedAttempt[]>([]);
  const [totalBidsValue, setTotalBidsValue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!request.user_id) return;

      try {
        setLoading(true);

        // Buscar lances do usuário
        const { data: bidsData } = await supabase
          .from('bids')
          .select(`
            id,
            bid_value,
            status,
            created_at,
            auction_item:auction_items(name),
            auctions(name)
          `)
          .eq('user_id', request.user_id)
          .order('created_at', { ascending: false })
          .limit(10);

        // Buscar tentativas bloqueadas
        const { data: attemptsData } = await supabase
          .from('failed_bid_attempts')
          .select('id, attempted_bid_value, current_limit, total_bids_at_attempt, created_at, auction_id, auction_item_id')
          .eq('user_id', request.user_id)
          .order('created_at', { ascending: false })
          .limit(10);

        // Buscar nomes de leilões e lotes separadamente
        const attemptsWithDetails = await Promise.all((attemptsData || []).map(async (attempt) => {
          const [auctionData, lotData] = await Promise.all([
            supabase.from('auctions').select('name').eq('id', attempt.auction_id).maybeSingle(),
            supabase.from('auction_items').select('name').eq('id', attempt.auction_item_id).maybeSingle()
          ]);
          
          return {
            ...attempt,
            auction: { name: auctionData.data?.name || 'Leilão' },
            auction_item: { name: lotData.data?.name || 'Lote' }
          };
        }));

        setBids(bidsData || []);
        setFailedAttempts(attemptsWithDetails);

        // Calcular total dos lances aprovados
        const total = (bidsData || [])
          .filter(bid => bid.status === 'approved')
          .reduce((sum, bid) => sum + Number(bid.bid_value), 0);
        setTotalBidsValue(total);

      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [request.user_id]);

  const approvedBids = bids.filter(bid => bid.status === 'approved');
  const pendingBids = bids.filter(bid => bid.status === 'pending');

  return (
    <div className="space-y-4">
      {/* Informações do Cliente */}
      <div className="bg-gray-900/50 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <User className="h-5 w-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Dados do Cliente</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Nome:</span>
            <div className="text-white font-medium">{request.user?.name}</div>
          </div>
          <div>
            <span className="text-gray-400">E-mail:</span>
            <div className="text-white font-medium">{request.user?.email}</div>
          </div>
        </div>
      </div>

      {/* Contexto da Solicitação */}
      {(request.auction_name || request.lot_name) && (
        <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/30">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-blue-400" />
            <h3 className="text-sm font-semibold text-blue-300">Contexto da Solicitação</h3>
          </div>
          <div className="space-y-1 text-sm">
            {request.auction_name && (
              <div>
                <span className="text-gray-400">Leilão:</span>
                <span className="text-white ml-2">{request.auction_name}</span>
              </div>
            )}
            {request.lot_name && (
              <div>
                <span className="text-gray-400">Lote:</span>
                <span className="text-white ml-2">{request.lot_name}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Limites */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-400">Limite Atual</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {formatCurrency(request.current_limit)}
          </div>
        </div>
        
        <div className="bg-green-900/20 rounded-lg p-4 border border-green-500/30">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span className="text-sm text-green-400">Limite Solicitado</span>
          </div>
          <div className="text-2xl font-bold text-green-400">
            {formatCurrency(request.requested_limit)}
          </div>
          <div className="text-xs text-green-300 mt-1">
            Aumento de {formatCurrency(request.requested_limit - request.current_limit)}
          </div>
        </div>
      </div>

      {/* Motivo */}
      {request.reason && (
        <div className="bg-gray-900/50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-white mb-2">Motivo da Solicitação:</h4>
          <p className="text-gray-300 text-sm">{request.reason}</p>
        </div>
      )}

      <Separator className="bg-gray-700" />

      {/* Estatísticas de Lances */}
      {!loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-900/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-white">{approvedBids.length}</div>
              <div className="text-xs text-gray-400">Lances Aprovados</div>
            </div>
            <div className="bg-yellow-900/20 rounded-lg p-3 text-center border border-yellow-500/30">
              <div className="text-2xl font-bold text-yellow-400">{pendingBids.length}</div>
              <div className="text-xs text-yellow-300">Lances Pendentes</div>
            </div>
            <div className="bg-red-900/20 rounded-lg p-3 text-center border border-red-500/30">
              <div className="text-2xl font-bold text-red-400">{failedAttempts.length}</div>
              <div className="text-xs text-red-300">Tentativas Bloqueadas</div>
            </div>
          </div>

          <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-500/30">
            <div className="text-sm text-blue-300 mb-1">Total em Lances Aprovados</div>
            <div className="text-xl font-bold text-blue-400">{formatCurrency(totalBidsValue)}</div>
          </div>
        </div>
      )}

      {/* Histórico de Lances */}
      {bids.length > 0 && (
        <div className="bg-gray-900/50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-white mb-3">Histórico de Lances (últimos 10)</h4>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {bids.map((bid) => (
                <div key={bid.id} className="bg-gray-800/50 rounded p-3 text-xs space-y-1">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-white font-medium">{bid.auctions?.name || 'Leilão'}</div>
                      <div className="text-gray-400">{bid.auction_item?.name || 'Lote'}</div>
                    </div>
                    <Badge className={bid.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                      {bid.status === 'approved' ? 'Aprovado' : 'Pendente'}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Valor: <span className="text-white font-semibold">{formatCurrency(bid.bid_value)}</span></span>
                    <span>{format(new Date(bid.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Tentativas Bloqueadas */}
      {failedAttempts.length > 0 && (
        <div className="bg-red-900/20 rounded-lg p-4 border border-red-500/30">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <h4 className="text-sm font-semibold text-red-300">Tentativas Bloqueadas (últimas 10)</h4>
          </div>
          <ScrollArea className="h-[150px]">
            <div className="space-y-2">
              {failedAttempts.map((attempt) => (
                <div key={attempt.id} className="bg-gray-800/50 rounded p-3 text-xs space-y-1">
                  <div className="flex justify-between">
                    <div>
                      <div className="text-white">{attempt.auction?.name}</div>
                      <div className="text-gray-400">{attempt.auction_item?.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-red-400 font-bold">{formatCurrency(attempt.attempted_bid_value)}</div>
                      <div className="text-gray-500">Limite: {formatCurrency(attempt.current_limit)}</div>
                    </div>
                  </div>
                  <div className="text-gray-500">
                    {format(new Date(attempt.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Ações */}
      <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
        <Button 
          variant="outline" 
          onClick={onReject}
          className="text-red-400 border-red-400 hover:bg-red-400/10"
        >
          <X className="h-4 w-4 mr-2" />
          Rejeitar
        </Button>
        <Button 
          onClick={onApprove}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Check className="h-4 w-4 mr-2" />
          Aprovar
        </Button>
      </div>
    </div>
  );
}
