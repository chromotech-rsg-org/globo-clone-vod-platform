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
      <Card className="group relative overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 hover:border-primary/50 rounded-3xl w-full aspect-[9/16]">
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
          <div className="absolute top-4 left-4 z-30">
            <Badge className="bg-red-500 text-white animate-pulse border-red-400 text-sm px-2 py-1 flex items-center gap-1 shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              AO VIVO
            </Badge>
          </div>
        )}

        {/* Winner Badge */}
        {hasWinner && (
          <div className="absolute top-4 right-4 z-30">
            <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white flex items-center gap-1 animate-pulse text-sm px-2 py-1 shadow-lg">
              <Trophy size={14} />
              Finalizado
            </Badge>
          </div>
        )}

        <CardContent className="relative z-20 p-0 h-full flex flex-col">
          {/* Hover Details - Enhanced Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/98 via-black/90 to-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 p-6 flex flex-col justify-center backdrop-blur-[1px]">
            <div className="space-y-4">
              {/* Date */}
              {auction.start_date && (
                <div className="flex items-center justify-center gap-2 text-lg text-white">
                  <Clock size={18} />
                  <span>
                    Início: {new Date(auction.start_date).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}

              {/* Stats Grid - Adjusted for better fit */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-background/20 backdrop-blur-sm rounded-lg p-3 border border-border/20">
                  <div className="flex items-center gap-1 mb-1">
                    <Target size={14} />
                    <span className="text-xs text-muted-foreground">Inicial</span>
                  </div>
                  <p className="text-sm font-medium text-white truncate">
                    {formatCurrency(auction.initial_bid_value)}
                  </p>
                </div>
                
                <div className="bg-primary/20 backdrop-blur-sm rounded-lg p-3 border border-primary/30">
                  <div className="flex items-center gap-1 mb-1">
                    <TrendingUp size={14} />
                    <span className="text-xs text-primary">
                      {hasWinner ? 'Final' : 'Atual'}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-primary truncate">
                    {formatCurrency(finalCurrentValue)}
                  </p>
                </div>
                
                <div className="bg-background/20 backdrop-blur-sm rounded-lg p-3 border border-border/20">
                  <div className="flex items-center gap-1 mb-1">
                    <Zap size={14} />
                    <span className="text-xs text-muted-foreground">Lances</span>
                  </div>
                  <p className="text-sm font-medium text-white">
                    {loading ? '...' : (stats?.totalBids || 0)}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <div className="w-full bg-primary/20 backdrop-blur-sm border border-primary/30 rounded-lg py-3 px-4 text-center group-hover:bg-primary/30 transition-colors">
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <Play size={18} />
                    <span className="text-base font-medium">Acessar Leilão</span>
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