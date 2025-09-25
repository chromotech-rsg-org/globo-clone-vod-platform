
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Clock, CheckCircle, XCircle, Trophy } from 'lucide-react';

interface Bid {
  id: string;
  user_id: string;
  bid_value: number;
  status: 'approved' | 'pending' | 'rejected' | 'superseded' | 'pre_bidding';
  is_winner: boolean;
  created_at: string;
  user_name?: string;
  auction_item?: {
    status?: string;
  };
}

interface BidHistoryProps {
  bids: Bid[];
  loading: boolean;
  currentUserId?: string;
}

const BidHistory: React.FC<BidHistoryProps> = ({ bids, loading, currentUserId }) => {
  const getStatusIcon = (status: string, isWinner: boolean, lotStatus?: string) => {
    if (isWinner) return <Trophy className="h-3 w-3 text-green-400" />;
    
    // Se é um lance de pré leilão (lote com status pre_bidding)
    if (lotStatus === 'pre_bidding' || status === 'pre_bidding') {
      return <Clock className="h-3 w-3 text-yellow-500" />;
    }
    
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-3 w-3 text-green-400" />;
      case 'pending':
        return <Clock className="h-3 w-3 text-yellow-400" />;
      case 'rejected':
        return <XCircle className="h-3 w-3 text-red-400" />;
      case 'superseded':
        return <XCircle className="h-3 w-3 text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusVariant = (status: string, isWinner: boolean, lotStatus?: string) => {
    if (isWinner) return 'default';
    
    // Se é um lance de pré leilão
    if (lotStatus === 'pre_bidding' || status === 'pre_bidding') {
      return 'secondary' as const;
    }
    
    switch (status) {
      case 'approved':
        return 'default' as const;
      case 'pending':
        return 'secondary' as const;
      case 'rejected':
        return 'destructive' as const;
      case 'superseded':
        return 'outline' as const;
      default:
        return 'outline' as const;
    }
  };

  const getStatusText = (status: string, isWinner: boolean, lotStatus?: string) => {
    if (isWinner) return 'Vencedor';
    
    // Se é um lance de pré leilão
    if (lotStatus === 'pre_bidding' || status === 'pre_bidding') {
      return 'Pré Lance';
    }
    
    switch (status) {
      case 'approved':
        return 'Aprovado';
      case 'pending':
        return 'Pendente';
      case 'rejected':
        return 'Rejeitado';
      case 'superseded':
        return 'Superado';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Card className="bg-black border-green-600/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-green-400 text-lg">Histórico de Lances</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-400 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black border-green-600/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-green-400 text-lg">
          Histórico de Lances ({bids.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {bids.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-sm">
            Nenhum lance foi feito ainda
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-900 [&::-webkit-scrollbar-thumb]:bg-green-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-green-500">
            {bids.map((bid) => (
              <div 
                key={bid.id} 
                className={`p-2.5 border rounded-md transition-all duration-200 hover:bg-green-600/10 hover:border-green-500/50 ${
                  bid.user_id === currentUserId 
                    ? 'bg-green-600/5 border-green-600/30' 
                    : 'bg-gray-900 border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm truncate">
                      {bid.user_id === currentUserId 
                        ? `${bid.user_name || 'Você'} (Você)`
                        : 'Usuário'
                      }
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDate(bid.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className="font-bold text-sm text-green-400">
                      {formatCurrency(bid.bid_value)}
                    </p>
                    <Badge 
                      variant={getStatusVariant(bid.status, bid.is_winner, bid.auction_item?.status)}
                      className={`flex items-center gap-1 text-xs h-5 px-1.5 ${
                        bid.is_winner 
                          ? 'bg-green-500 text-white hover:bg-green-600 border-green-400' 
                          : (bid.auction_item?.status === 'pre_bidding' || bid.status === 'pre_bidding')
                          ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/30'
                          : bid.status === 'approved'
                          ? 'bg-green-600/20 text-green-400 border-green-600/30 hover:bg-green-600/30'
                          : bid.status === 'pending'
                          ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30'
                          : bid.status === 'rejected'
                          ? 'bg-red-600/20 text-red-400 border-red-600/30'
                          : 'bg-gray-600/20 text-gray-400 border-gray-600/30'
                      }`}
                    >
                      {getStatusIcon(bid.status, bid.is_winner, bid.auction_item?.status)}
                      <span className="truncate max-w-16">
                        {getStatusText(bid.status, bid.is_winner, bid.auction_item?.status)}
                      </span>
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BidHistory;
