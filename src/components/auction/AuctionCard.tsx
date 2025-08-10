import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Auction } from '@/types/auction';
import { formatCurrency } from '@/utils/formatters';
import { Play, Square, Trophy, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuctionStats } from '@/hooks/useAuctionStats';

interface AuctionCardProps {
  auction: Auction;
}

const AuctionCard = ({ auction }: AuctionCardProps) => {
  const { stats, loading } = useAuctionStats(auction.id);

  return (
    <Link to={`/auctions/${auction.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {auction.name}
              </h3>
              {auction.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {auction.description}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge 
                variant={auction.is_live ? "default" : "secondary"}
                className="flex items-center gap-1"
              >
                {auction.is_live ? <Play size={12} /> : <Square size={12} />}
                {auction.is_live ? 'AO VIVO' : 'GRAVADO'}
              </Badge>
              <Badge variant="outline">
                {auction.auction_type === 'rural' ? 'Rural' : 'Judicial'}
              </Badge>
              {stats?.hasWinner && (
                <Badge className="bg-green-500 text-white flex items-center gap-1">
                  <Trophy size={12} />
                  Finalizado
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Target size={10} />
                Lance Inicial
              </p>
              <p className="text-sm font-medium text-muted-foreground">
                {formatCurrency(auction.initial_bid_value)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {stats?.hasWinner ? 'Arrematado' : 'Lance Atual'}
              </p>
              <p className={`text-lg font-bold ${stats?.hasWinner ? 'text-green-600' : 'text-primary'}`}>
                {stats?.hasWinner && stats?.winnerBidValue 
                  ? formatCurrency(stats.winnerBidValue)
                  : formatCurrency(auction.current_bid_value)
                }
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Total de Lances
              </p>
              <p className="text-sm font-medium">
                {loading ? '...' : (stats?.totalBids || 0)}
              </p>
            </div>
          </div>

          {(auction.start_date || auction.end_date) && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-xs text-muted-foreground space-y-2">
                {auction.start_date && auction.end_date ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {new Date(auction.start_date).toLocaleDateString('pt-BR')}
                      </span>
                      <div className="text-right">
                        <div className="text-xs">
                          {new Date(auction.start_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {new Date(auction.end_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    
                    {/* Barra de Progresso da Duração */}
                    {(() => {
                      const now = new Date().getTime();
                      const start = new Date(auction.start_date).getTime();
                      const end = new Date(auction.end_date).getTime();
                      const totalDuration = end - start;
                      const elapsed = Math.max(0, now - start);
                      const progress = Math.min(100, (elapsed / totalDuration) * 100);
                      
                      return (
                        <div className="space-y-1">
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                now < start ? 'bg-blue-500' : 
                                now > end ? 'bg-gray-500' : 
                                'bg-primary'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="text-center text-xs">
                            {now < start ? 'Não iniciado' :
                             now > end ? 'Finalizado' :
                             `${Math.round(progress)}% concluído`}
                          </div>
                        </div>
                      );
                    })()}
                  </>
                ) : auction.start_date ? (
                  <div>Início: {new Date(auction.start_date).toLocaleString('pt-BR')}</div>
                ) : auction.end_date ? (
                  <div>Fim: {new Date(auction.end_date).toLocaleString('pt-BR')}</div>
                ) : null}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

export default AuctionCard;