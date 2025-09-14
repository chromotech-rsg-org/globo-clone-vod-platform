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
      <Card className="group relative overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 hover:border-primary/50 rounded-3xl" style={{width: '1080px', height: '1920px'}}>
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-500"
          style={{
            backgroundImage: `url('${auction.image_url || '/assets/auction-channel-bg-mobile.jpg'}')`
          }}
        />
        
        {/* Light gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent group-hover:from-black/80 transition-all duration-500" />
        
        {/* Live Indicator */}
        {auction.is_live && (
          <div className="absolute top-3 left-3 z-30">
            <Badge className="bg-red-500 text-white animate-pulse border-red-400 text-xs px-2 py-1 flex items-center gap-1 shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              AO VIVO
            </Badge>
          </div>
        )}

        {/* Winner Badge */}
        {hasWinner && (
          <div className="absolute top-3 right-3 z-30">
            <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white flex items-center gap-1 animate-pulse text-xs px-2 py-1 shadow-lg">
              <Trophy size={12} />
              Finalizado
            </Badge>
          </div>
        )}

        <CardContent className="relative z-20 p-0 h-full flex flex-col">
          {/* Content Always Over Image */}
          <div className="p-4 flex-1 flex flex-col justify-end">
            <div className="space-y-2">
              <Badge 
                variant="outline" 
                className="w-fit border-primary/60 text-primary bg-primary/20 text-xs px-2 py-1 shadow-sm backdrop-blur-sm"
              >
                {auction.auction_type === 'rural' ? '🌾 Rural' : '⚖️ Judicial'}
              </Badge>
              
              <h3 className="text-2xl font-bold text-white line-clamp-2 group-hover:text-primary transition-colors drop-shadow-lg">
                {auction.name}
              </h3>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-primary drop-shadow-md">
                  <TrendingUp size={14} />
                  <span className="text-lg font-semibold">
                    {formatCurrency(finalCurrentValue)}
                  </span>
                </div>
                {!auction.is_live && (
                  <div className="flex items-center gap-1 text-slate-200 drop-shadow-md">
                    <Square size={12} />
                    <span className="text-sm">Gravado</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hover Details - Enhanced Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/98 via-black/90 to-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 p-4 flex flex-col justify-end backdrop-blur-[1px]">
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