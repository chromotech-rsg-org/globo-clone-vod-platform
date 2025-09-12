import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Auction } from '@/types/auction';
import { formatCurrency } from '@/utils/formatters';
import { Play, Square, Trophy, Target, Clock, Zap, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuctionStats } from '@/hooks/useAuctionStats';

interface AuctionChannelCardProps {
  auction: Auction;
}

const AuctionChannelCard = ({ auction }: AuctionChannelCardProps) => {
  const { stats, loading } = useAuctionStats(auction.id);

  const finalCurrentValue = stats?.winnerBidValue || auction.current_bid_value;
  const hasWinner = stats?.hasWinner || false;

  return (
    <Link to={`/auctions/${auction.id}`} className="block h-full">
      <Card className="group relative h-[280px] overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 hover:border-primary/50">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-50 transition-opacity duration-500"
          style={{
            backgroundImage: `url('/assets/auction-channel-bg.jpg')`
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30 group-hover:from-black/95 transition-all duration-500" />
        
        {/* Live Indicator */}
        {auction.is_live && (
          <div className="absolute top-3 left-3 z-20">
            <Badge className="bg-red-500 text-white animate-pulse border-red-400 text-xs px-2 py-1 flex items-center gap-1">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              AO VIVO
            </Badge>
          </div>
        )}

        {/* Winner Badge */}
        {hasWinner && (
          <div className="absolute top-3 right-3 z-20">
            <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white flex items-center gap-1 animate-pulse text-xs px-2 py-1">
              <Trophy size={12} />
              Finalizado
            </Badge>
          </div>
        )}

        <CardContent className="relative z-10 p-0 h-full flex flex-col">
          {/* Top Section - Always Visible */}
          <div className="p-4 flex-1 flex flex-col justify-end">
            <div className="space-y-2">
              <Badge 
                variant="outline" 
                className="w-fit border-primary/50 text-primary bg-primary/10 text-xs px-2 py-1"
              >
                {auction.auction_type === 'rural' ? '🌾 Rural' : '⚖️ Judicial'}
              </Badge>
              
              <h3 className="text-lg font-bold text-white line-clamp-2 group-hover:text-primary transition-colors">
                {auction.name}
              </h3>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-primary">
                  <TrendingUp size={14} />
                  <span className="text-sm font-semibold">
                    {formatCurrency(finalCurrentValue)}
                  </span>
                </div>
                {!auction.is_live && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Square size={12} />
                    <span className="text-xs">Gravado</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hover Details - Only visible on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/85 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 p-4 flex flex-col justify-end">
            <div className="space-y-3">
              {/* Description */}
              {auction.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {auction.description}
                </p>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-background/20 backdrop-blur-sm rounded-lg p-2 border border-border/20">
                  <div className="flex items-center gap-1 mb-1">
                    <Target size={10} />
                    <span className="text-xs text-muted-foreground">Inicial</span>
                  </div>
                  <p className="text-xs font-medium text-white">
                    {formatCurrency(auction.initial_bid_value)}
                  </p>
                </div>
                
                <div className="bg-primary/20 backdrop-blur-sm rounded-lg p-2 border border-primary/30">
                  <div className="flex items-center gap-1 mb-1">
                    <TrendingUp size={10} />
                    <span className="text-xs text-primary">
                      {hasWinner ? 'Arrematado' : 'Atual'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-primary">
                    {formatCurrency(finalCurrentValue)}
                  </p>
                </div>
                
                <div className="bg-background/20 backdrop-blur-sm rounded-lg p-2 border border-border/20">
                  <div className="flex items-center gap-1 mb-1">
                    <Zap size={10} />
                    <span className="text-xs text-muted-foreground">Lances</span>
                  </div>
                  <p className="text-xs font-medium text-white">
                    {loading ? '...' : (stats?.totalBids || 0)}
                  </p>
                </div>
              </div>

              {/* Date and Progress */}
              {auction.start_date && auction.end_date && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock size={10} />
                    <span>
                      {new Date(auction.start_date).toLocaleDateString('pt-BR')} - {new Date(auction.end_date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  
                  {(() => {
                    const now = new Date().getTime();
                    const start = new Date(auction.start_date).getTime();
                    const end = new Date(auction.end_date).getTime();
                    const totalDuration = end - start;
                    const elapsed = Math.max(0, now - start);
                    const progress = Math.min(100, (elapsed / totalDuration) * 100);
                    
                    return (
                      <div className="space-y-1">
                        <div className="w-full bg-background/30 rounded-full h-1 overflow-hidden">
                          <div 
                            className={`h-1 rounded-full transition-all duration-500 ${
                              now < start ? 'bg-blue-500' : 
                              now > end ? 'bg-muted-foreground' : 
                              'bg-primary'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="text-center text-xs">
                          {now < start ? (
                            <span className="text-blue-400">Não iniciado</span>
                          ) : now > end ? (
                            <span className="text-muted-foreground">Finalizado</span>
                          ) : (
                            <span className="text-primary">{Math.round(progress)}% concluído</span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2">
                <div className="w-full bg-primary/20 backdrop-blur-sm border border-primary/30 rounded-lg py-2 px-3 text-center group-hover:bg-primary/30 transition-colors">
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <Play size={14} />
                    <span className="text-sm font-medium">Acessar Leilão</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default AuctionChannelCard;