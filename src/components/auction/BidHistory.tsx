
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Clock, CheckCircle, XCircle, Trophy } from 'lucide-react';

interface Bid {
  id: string;
  user_id: string;
  bid_value: number;
  status: 'approved' | 'pending' | 'rejected' | 'superseded';
  is_winner: boolean;
  created_at: string;
  user_name?: string;
}

interface BidHistoryProps {
  bids: Bid[];
  loading: boolean;
  currentUserId?: string;
}

const BidHistory: React.FC<BidHistoryProps> = ({ bids, loading, currentUserId }) => {
  const getStatusIcon = (status: string, isWinner: boolean) => {
    if (isWinner) return <Trophy className="h-4 w-4 text-green-400" />;
    
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'superseded':
        return <XCircle className="h-4 w-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusVariant = (status: string, isWinner: boolean) => {
    if (isWinner) return 'default';
    
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

  const getStatusText = (status: string, isWinner: boolean) => {
    if (isWinner) return 'Vencedor';
    
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
      <Card className="bg-gray-900 border-green-600/30">
        <CardHeader>
          <CardTitle className="text-green-400">Histórico de Lances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-green-600/30">
      <CardHeader>
        <CardTitle className="text-green-400">Histórico de Lances ({bids.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {bids.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            Nenhum lance foi feito ainda
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-hidden">
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-thumb]:bg-green-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-green-500">
              {bids.map((bid) => (
              <div 
                key={bid.id} 
                className={`p-3 border rounded-lg transition-all duration-200 hover:bg-green-600/10 hover:border-green-500/50 ${
                  bid.user_id === currentUserId 
                    ? 'bg-green-600/5 border-green-600/30' 
                    : 'bg-gray-800 border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-white">
                        {bid.user_id === currentUserId 
                          ? `${bid.user_name || 'Você'} (Você)`
                          : 'Usuário'
                        }
                      </p>
                      <p className="text-sm text-gray-400">
                        {formatDate(bid.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-green-400">
                      {formatCurrency(bid.bid_value)}
                    </p>
                    <Badge 
                      variant={getStatusVariant(bid.status, bid.is_winner)}
                      className={`flex items-center gap-1 w-fit ml-auto ${
                        bid.is_winner 
                          ? 'bg-green-500 text-white hover:bg-green-600 border-green-400' 
                          : bid.status === 'approved'
                          ? 'bg-green-600/20 text-green-400 border-green-600/30 hover:bg-green-600/30'
                          : bid.status === 'pending'
                          ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30'
                          : bid.status === 'rejected'
                          ? 'bg-red-600/20 text-red-400 border-red-600/30'
                          : 'bg-gray-600/20 text-gray-400 border-gray-600/30'
                      }`}
                    >
                      {getStatusIcon(bid.status, bid.is_winner)}
                      {getStatusText(bid.status, bid.is_winner)}
                    </Badge>
                  </div>
                </div>
              </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BidHistory;
