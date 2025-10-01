import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency } from '@/utils/formatters';
import { TrendingUp, AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LimitRequest {
  id: string;
  requested_limit: number;
  reason: string | null;
  status: string;
  created_at: string;
  auction_name?: string | null;
  lot_name?: string | null;
}

interface FailedAttempt {
  id: string;
  attempted_bid_value: number;
  auction_name: string;
  lot_name: string;
  created_at: string;
}

interface ClientLimitCardProps {
  userName: string;
  userEmail: string;
  currentLimit: number;
  isUnlimited: boolean;
  pendingRequests: LimitRequest[];
  failedAttempts: FailedAttempt[];
  onReviewRequest: (requestId: string) => void;
  onEditLimit: () => void;
}

export function ClientLimitCard({
  userName,
  userEmail,
  currentLimit,
  isUnlimited,
  pendingRequests,
  failedAttempts,
  onReviewRequest,
  onEditLimit
}: ClientLimitCardProps) {
  const hasPendingRequests = pendingRequests.length > 0;
  const hasFailedAttempts = failedAttempts.length > 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  return (
    <Card className={`${hasPendingRequests ? 'border-yellow-500/50 bg-yellow-900/10' : 'border-gray-700'}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg text-white">{userName}</CardTitle>
            <p className="text-sm text-gray-400">{userEmail}</p>
          </div>
          <div className="text-right">
            {isUnlimited ? (
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">
                Ilimitado
              </Badge>
            ) : (
              <div className="max-w-[140px]">
                <p className="text-xs text-gray-400">Limite</p>
                <p className="text-lg font-bold text-white break-words">{formatCurrency(currentLimit)}</p>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Pending Requests */}
        {hasPendingRequests && (
          <div className="bg-yellow-900/20 rounded-lg p-3 border border-yellow-500/30">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-yellow-400" />
              <h4 className="text-sm font-semibold text-yellow-300">
                Solicitações Pendentes ({pendingRequests.length})
              </h4>
            </div>
            <ScrollArea className="h-[160px] pr-2">
              <div className="space-y-2">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="bg-gray-900/50 rounded p-2 space-y-1">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs text-gray-400 flex-shrink-0">Novo limite:</span>
                      <span className="text-sm font-bold text-white text-right break-words">{formatCurrency(request.requested_limit)}</span>
                    </div>
                    {(request.auction_name || request.lot_name) && (
                      <div className="text-xs text-gray-500 space-y-0.5">
                        {request.auction_name && <div>Leilão: {request.auction_name}</div>}
                        {request.lot_name && <div>Lote: {request.lot_name}</div>}
                      </div>
                    )}
                    {request.reason && (
                      <p className="text-xs text-gray-400 break-words">"{request.reason}"</p>
                    )}
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {format(new Date(request.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => onReviewRequest(request.id)}
                        className="h-7 text-xs bg-green-600 hover:bg-green-700 flex-shrink-0"
                      >
                        Analisar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Failed Attempts */}
        {hasFailedAttempts && (
          <div className="bg-red-900/20 rounded-lg p-3 border border-red-500/30">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <h4 className="text-sm font-semibold text-red-300">
                Tentativas Bloqueadas ({failedAttempts.length})
              </h4>
            </div>
            <ScrollArea className="h-[160px] pr-2">
              <div className="space-y-2">
                {failedAttempts.map((attempt) => (
                  <div key={attempt.id} className="bg-gray-900/50 rounded p-2 text-xs space-y-1">
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-400 flex-shrink-0">Lance:</span>
                      <span className="text-red-400 font-bold text-right break-all">{formatCurrency(attempt.attempted_bid_value)}</span>
                    </div>
                    <div className="text-gray-500 break-words">
                      <div>{attempt.auction_name}</div>
                      <div>Lote: {attempt.lot_name}</div>
                    </div>
                    <div className="text-gray-600">
                      {format(new Date(attempt.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* All Requests History (last 3) */}
        {pendingRequests.length === 0 && failedAttempts.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-2">
            Nenhuma atividade recente
          </p>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={onEditLimit}
          className="w-full"
        >
          Editar Limite
        </Button>
      </CardContent>
    </Card>
  );
}
