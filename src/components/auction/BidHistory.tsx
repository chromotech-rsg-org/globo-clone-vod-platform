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
    if (isWinner) return <Trophy className="h-4 w-4" />;
    
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'superseded':
        return <XCircle className="h-4 w-4" />;
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
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Lances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Lances ({bids.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {bids.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum lance foi feito ainda
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {bids.map((bid) => (
              <div 
                key={bid.id} 
                className={`p-3 border rounded-lg ${
                  bid.user_id === currentUserId ? 'bg-primary/5 border-primary/20' : 'bg-background'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">
                        {bid.user_name || 'Usuário'}
                        {bid.user_id === currentUserId && (
                          <span className="text-xs text-primary ml-2">(Você)</span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(bid.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">
                      {formatCurrency(bid.bid_value)}
                    </p>
                    <Badge 
                      variant={getStatusVariant(bid.status, bid.is_winner)}
                      className={`flex items-center gap-1 w-fit ml-auto ${
                        bid.is_winner ? 'bg-green-500 text-white hover:bg-green-600' : ''
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
        )}
      </CardContent>
    </Card>
  );
};

export default BidHistory;