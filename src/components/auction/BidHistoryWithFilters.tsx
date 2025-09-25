import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatters';
import { Clock, CheckCircle, XCircle, Trophy, Filter, Package } from 'lucide-react';
import { Bid, AuctionItem } from '@/types/auction';

interface BidHistoryWithFiltersProps {
  bids: Bid[];
  lots: AuctionItem[];
  loading: boolean;
  currentUserId?: string;
}

const BidHistoryWithFilters = ({ bids, lots, loading, currentUserId }: BidHistoryWithFiltersProps) => {
  const [selectedLotId, setSelectedLotId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredBids = useMemo(() => {
    let filtered = [...bids];

    // Filtrar por lote
    if (selectedLotId !== 'all') {
      filtered = filtered.filter(bid => bid.auction_item_id === selectedLotId);
    }

    // Filtrar por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(bid => bid.status === statusFilter);
    }

    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [bids, selectedLotId, statusFilter]);

  const getLotName = (lotId: string) => {
    const lot = lots.find(l => l.id === lotId);
    const lotIndex = lots.findIndex(l => l.id === lotId) + 1;
    return lot ? `Lote ${lotIndex} - ${lot.name}` : `Lote ${lotId.slice(-4)}`;
  };

  const getStatusInfo = (status: string, isWinner: boolean) => {
    if (isWinner) {
      return {
        icon: <Trophy className="h-3 w-3" />,
        label: 'Vencedor',
        className: 'bg-green-500 text-white hover:bg-green-600 border-green-400'
      };
    }
    
    switch (status) {
      case 'approved':
        return {
          icon: <CheckCircle className="h-3 w-3" />,
          label: 'Aprovado',
          className: 'bg-green-600/20 text-green-400 border-green-600/30 hover:bg-green-600/30'
        };
      case 'pending':
        return {
          icon: <Clock className="h-3 w-3" />,
          label: 'Pendente',
          className: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30'
        };
      case 'rejected':
        return {
          icon: <XCircle className="h-3 w-3" />,
          label: 'Rejeitado',
          className: 'bg-red-600/20 text-red-400 border-red-600/30'
        };
      case 'superseded':
        return {
          icon: <XCircle className="h-3 w-3" />,
          label: 'Superado',
          className: 'bg-gray-600/20 text-gray-400 border-gray-600/30'
        };
      default:
        return {
          icon: <Clock className="h-3 w-3" />,
          label: status,
          className: 'bg-gray-600/20 text-gray-400 border-gray-600/30'
        };
    }
  };

  const clearFilters = () => {
    setSelectedLotId('all');
    setStatusFilter('all');
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
        <CardTitle className="text-green-400 text-lg flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Histórico de Lances ({filteredBids.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Filtros */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3">
            {/* Filtro por Lote */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Filtrar por Lote</label>
              <Select value={selectedLotId} onValueChange={setSelectedLotId}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Todos os lotes" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all" className="text-white">Todos os lotes</SelectItem>
                  {lots.map((lot, index) => (
                    <SelectItem key={lot.id} value={lot.id} className="text-white">
                      Lote {index + 1} - {lot.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Status */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Filtrar por Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all" className="text-white">Todos os status</SelectItem>
                  <SelectItem value="approved" className="text-white">Aprovados</SelectItem>
                  <SelectItem value="pending" className="text-white">Pendentes</SelectItem>
                  <SelectItem value="rejected" className="text-white">Rejeitados</SelectItem>
                  <SelectItem value="superseded" className="text-white">Superados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botão para limpar filtros */}
          {(selectedLotId !== 'all' || statusFilter !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="w-full bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Limpar Filtros
            </Button>
          )}
        </div>

        {/* Lista de Lances */}
        {filteredBids.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-sm">
            {bids.length === 0 
              ? 'Nenhum lance foi feito ainda'
              : 'Nenhum lance encontrado com os filtros aplicados'
            }
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-900 [&::-webkit-scrollbar-thumb]:bg-green-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-green-500">
            {filteredBids.map((bid) => {
              const statusInfo = getStatusInfo(bid, lots);
              const isCurrentUser = bid.user_id === currentUserId;

              return (
                <div 
                  key={bid.id} 
                  className={`p-3 border rounded-md transition-all duration-200 hover:bg-green-600/10 hover:border-green-500/50 ${
                    isCurrentUser 
                      ? 'bg-green-600/5 border-green-600/30' 
                      : 'bg-gray-900 border-gray-700'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Linha 1: Usuário e Valor */}
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm truncate">
                          {isCurrentUser 
                            ? `${bid.user_name || 'Você'} (Você)`
                            : 'Usuário'
                          }
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDateTime(bid.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-green-400">
                          {formatCurrency(bid.bid_value)}
                        </p>
                      </div>
                    </div>

                    {/* Linha 2: Lote e Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Package className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-400 truncate">
                          {getLotName(bid.auction_item_id)}
                        </span>
                      </div>
                      <Badge className={`flex items-center gap-1 text-xs h-5 px-1.5 ${statusInfo.className}`}>
                        {statusInfo.icon}
                        <span className="truncate max-w-16">
                          {statusInfo.label}
                        </span>
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BidHistoryWithFilters;