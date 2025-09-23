import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuctionItems } from '@/hooks/useAuctionItems';
import { useAuctionBids } from '@/hooks/useAuctionBids';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/utils/formatters';
import { Auction, AuctionItem } from '@/types/auction';
import { Gavel, Target, Clock } from 'lucide-react';

interface PreBiddingLotSelectorProps {
  auction: Auction;
}

const PreBiddingLotSelector = ({ auction }: PreBiddingLotSelectorProps) => {
  const { user } = useAuth();
  const { items: lots, loading } = useAuctionItems(auction.id);
  const { bids, submitBid, submittingBid } = useAuctionBids(auction.id);
  const [selectedLot, setSelectedLot] = useState<AuctionItem | null>(null);
  const [bidValues, setBidValues] = useState<Record<string, number>>({});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
      </div>
    );
  }

  if (!lots || lots.length === 0) {
    return (
      <Card className="text-center py-16 bg-gradient-to-br from-gray-900/80 to-black/60 border-green-600/30">
        <CardContent>
          <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Target size={32} className="text-gray-500" />
          </div>
          <h3 className="text-2xl font-semibold text-white mb-4">
            Nenhum lote disponível
          </h3>
          <p className="text-gray-400 text-lg">
            Este leilão ainda não possui lotes cadastrados.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleBidValueChange = (lotId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setBidValues(prev => ({
      ...prev,
      [lotId]: numValue
    }));
  };

  const handlePreBid = async (lot: AuctionItem) => {
    if (!user) return;
    
    const bidValue = bidValues[lot.id];
    if (!bidValue || bidValue <= lot.current_value) return;

    try {
      await submitBid(bidValue as any);
      // Reset bid value after successful submission
      setBidValues(prev => ({
        ...prev,
        [lot.id]: 0
      }));
    } catch (error) {
      console.error('Erro ao fazer pré lance:', error);
    }
  };

  const getLotUserBids = (lotId: string) => {
    return bids.filter(bid => 
      bid.auction_item_id === lotId && 
      bid.user_id === user?.id
    ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const getMinimumBid = (lot: AuctionItem) => {
    const increment = lot.increment || auction.bid_increment || 100;
    return lot.current_value + increment;
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">{auction.name}</h2>
        <div className="flex items-center justify-center gap-2 text-green-400">
          <Target size={20} />
          <span className="text-lg">Pré Lance - Selecione os lotes desejados</span>
        </div>
      </div>

      <div className="grid gap-6">
        {lots.map((lot) => {
          const userBids = getLotUserBids(lot.id);
          const minimumBid = getMinimumBid(lot);
          const currentBidValue = bidValues[lot.id] || minimumBid;
          const hasActiveBid = userBids.some(bid => ['pending', 'approved'].includes(bid.status));

          return (
            <Card key={lot.id} className="bg-gradient-to-br from-gray-900/80 to-black/60 border-green-600/30">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-white text-xl mb-2">
                      Lote {lot.order_index + 1}: {lot.name}
                    </CardTitle>
                    {lot.description && (
                      <p className="text-gray-300 text-sm mb-3">{lot.description}</p>
                    )}
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="border-green-600/50 text-green-400">
                        <Gavel size={12} className="mr-1" />
                        Valor atual: {formatCurrency(lot.current_value)}
                      </Badge>
                      {lot.status !== 'not_started' && (
                        <Badge variant={lot.status === 'in_progress' ? 'default' : 'secondary'}>
                          {lot.status === 'in_progress' ? 'Em andamento' : 
                           lot.status === 'finished' ? 'Finalizado' : 'Não iniciado'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {lot.image_url && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                      <img 
                        src={lot.image_url} 
                        alt={lot.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                {/* User's previous bids */}
                {userBids.length > 0 && (
                  <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
                    <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                      <Clock size={14} />
                      Seus lances anteriores
                    </h4>
                    <div className="space-y-1">
                      {userBids.slice(0, 3).map((bid) => (
                        <div key={bid.id} className="flex justify-between items-center text-sm">
                          <span className="text-gray-300">
                            {formatCurrency(bid.bid_value)}
                          </span>
                          <Badge 
                            variant={
                              bid.status === 'approved' ? 'default' : 
                              bid.status === 'pending' ? 'secondary' : 'destructive'
                            }
                            className="text-xs"
                          >
                            {bid.status === 'approved' ? 'Aprovado' : 
                             bid.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pre-bid form */}
                {lot.status !== 'finished' && user && (
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Valor do pré lance (mín. {formatCurrency(minimumBid)})
                      </label>
                      <Input
                        type="number"
                        min={minimumBid}
                        step="0.01"
                        value={currentBidValue}
                        onChange={(e) => handleBidValueChange(lot.id, e.target.value)}
                        className="bg-black border-green-600/30 text-white"
                        placeholder={formatCurrency(minimumBid)}
                      />
                    </div>
                    <Button
                      onClick={() => handlePreBid(lot)}
                      disabled={
                        submittingBid || 
                        currentBidValue < minimumBid || 
                        hasActiveBid ||
                        !user
                      }
                      className="bg-green-600 hover:bg-green-700 text-white min-w-[120px]"
                    >
                      {submittingBid ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Enviando...
                        </div>
                      ) : hasActiveBid ? (
                        'Lance Ativo'
                      ) : (
                        'Pré Lance'
                      )}
                    </Button>
                  </div>
                )}

                {!user && (
                  <div className="text-center py-4">
                    <p className="text-gray-400 mb-3">
                      Faça login para participar do pré lance
                    </p>
                    <Button variant="outline" className="border-green-600/50 text-green-400">
                      Fazer Login
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default PreBiddingLotSelector;