import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Auction } from '@/types/auction';
import { formatCurrency } from '@/utils/formatters';
import { Play, Square, Trophy, Target, Clock, Zap, TrendingUp, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuctionStats } from '@/hooks/useAuctionStats';
import { useAuctionItems } from '@/hooks/useAuctionItems';

interface AuctionChannelCardProps {
  auction: Auction;
}

const AuctionChannelCard = ({ auction }: AuctionChannelCardProps) => {
  const { stats, loading } = useAuctionStats(auction.id);
  const { items: lots, loading: lotsLoading } = useAuctionItems(auction.id);

  const finalCurrentValue = stats?.winnerBidValue || auction.current_bid_value;
  const hasWinner = stats?.hasWinner || false;
  const currentLot = lots?.find(lot => lot.is_current) || lots?.find(lot => lot.status === 'in_progress') || null;
  const totalLots = lots?.length || 0;

  // Calculate time progress based on start and end dates
  const calculateTimeProgress = () => {
    if (!auction.start_date) return { progress: 0, timeText: 'Sem programação', isFinished: hasWinner };
    
    const startDate = new Date(auction.start_date);
    const endDate = auction.end_date ? new Date(auction.end_date) : null;
    const now = new Date();
    
    // Calculate elapsed time from start
    const elapsedMs = now.getTime() - startDate.getTime();
    const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
    const elapsedHours = Math.floor(elapsedMinutes / 60);
    const remainingMinutes = elapsedMinutes % 60;
    
    // If auction hasn't started yet
    if (elapsedMinutes < 0) {
      const absMinutes = Math.abs(elapsedMinutes);
      const absHours = Math.floor(absMinutes / 60);
      const absRemainingMinutes = absMinutes % 60;
      const timeText = absHours > 0 ? `${absHours}h ${absRemainingMinutes}min` : `${absMinutes}min`;
      return { progress: 0, timeText: `Inicia em ${timeText}`, isFinished: false };
    }
    
    // If there's an end date, calculate based on total duration
    if (endDate) {
      const totalDurationMs = endDate.getTime() - startDate.getTime();
      const totalDurationMinutes = Math.floor(totalDurationMs / (1000 * 60));
      
      // Check if auction time has passed
      const isTimeFinished = now.getTime() >= endDate.getTime();
      
      if (isTimeFinished || hasWinner) {
        const timeText = elapsedHours > 0 ? `${elapsedHours}h ${remainingMinutes}min` : `${elapsedMinutes}min`;
        return { 
          progress: 100, 
          timeText: hasWinner ? `Finalizado em ${timeText}` : `Tempo encerrado (${timeText})`, 
          isFinished: true 
        };
      }
      
      // Calculate progress percentage
      const progress = totalDurationMinutes > 0 ? Math.min((elapsedMinutes / totalDurationMinutes) * 100, 100) : 0;
      const timeText = elapsedHours > 0 ? `${elapsedHours}h ${remainingMinutes}min` : `${elapsedMinutes}min`;
      
      return { 
        progress, 
        timeText: `${timeText} em execução`, 
        isFinished: false 
      };
    }
    
    // If no end date, assume ongoing and use elapsed time
    if (hasWinner) {
      const timeText = elapsedHours > 0 ? `${elapsedHours}h ${remainingMinutes}min` : `${elapsedMinutes}min`;
      return { progress: 100, timeText: `Finalizado em ${timeText}`, isFinished: true };
    }
    
    // For ongoing auctions without end date, show as 50% progress after 2 hours
    const assumedDuration = 120; // 2 hours
    const progress = Math.min((elapsedMinutes / assumedDuration) * 100, 90); // Max 90% for ongoing
    const timeText = elapsedHours > 0 ? `${elapsedHours}h ${remainingMinutes}min` : `${elapsedMinutes}min`;
    
    return { 
      progress, 
      timeText: `${timeText} em execução`, 
      isFinished: false 
    };
  };

  const timeInfo = calculateTimeProgress();

  return (
    <Link to={`/auctions/${auction.id}`} className="block h-full">
      <Card className="group relative overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 hover:border-primary/50 rounded-3xl w-full aspect-[2/3]">
        {/* Background Image - Full coverage with rounded corners */}
        <div 
          className="absolute inset-0 transition-all duration-500 rounded-3xl overflow-hidden"
          style={{
            backgroundImage: `url('${auction.image_url || '/assets/auction-channel-bg-mobile.jpg'}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 group-hover:from-black/95 group-hover:via-black/80 group-hover:to-black/70 transition-all duration-500" />
        
        {/* Default visible content - Only badges */}
        <div className="absolute inset-0 group-hover:opacity-0 transition-opacity duration-300">
          {/* Live Indicator */}
          {auction.is_live && (
            <div className="absolute top-4 left-4 z-30">
              <Badge className="bg-red-500 text-white animate-pulse border-red-400 text-sm px-3 py-1.5 flex items-center gap-2 shadow-lg">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                AO VIVO
              </Badge>
            </div>
          )}

          {/* Winner Badge */}
          {hasWinner && (
            <div className="absolute top-4 right-4 z-30">
              <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white flex items-center gap-2 text-sm px-3 py-1.5 shadow-lg">
                <Trophy size={16} />
                FINALIZADO
              </Badge>
            </div>
          )}
        </div>

        {/* Hover Content - Full info */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 p-6 flex flex-col">
          {/* Header with auction name */}
          <div className="text-center mb-4">
            <h3 className="text-white text-xl font-bold mb-2 leading-tight">
              {auction.name}
            </h3>
            
            {/* Lot info with current lot details */}
            <div className="flex flex-col items-center gap-2 text-white/90 text-sm mb-2">
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-1">
                  <Package size={16} />
                  <span>{totalLots} {totalLots === 1 ? 'Lote' : 'Lotes'}</span>
                </div>
                {currentLot && (
                  <div className="flex items-center gap-1">
                    <Play size={16} className="text-green-400" />
                    <span className="text-green-400">Em andamento</span>
                  </div>
                )}
              </div>
              
              {/* Current lot name and bid info */}
              {currentLot && (
                <div className="text-center bg-black/40 rounded-lg px-3 py-2 backdrop-blur-sm border border-white/20">
                  <div className="text-green-400 font-semibold mb-1">
                    Lote Atual: {currentLot.name}
                  </div>
                  <div className="text-xs text-white/80">
                    Valor Atual: {formatCurrency(currentLot.current_value)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Date */}
          {auction.start_date && (
            <div className="flex items-center justify-center gap-2 text-white text-base mb-6">
              <Clock size={18} />
              <span>Início: {new Date(auction.start_date).toLocaleDateString('pt-BR')}</span>
            </div>
          )}

          {/* Stats - Vertical layout for better visibility */}
          <div className="flex-1 flex flex-col justify-center space-y-4 mb-6">
            <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <Target size={14} className="text-gray-300" />
                    <span className="text-xs text-gray-300 uppercase font-semibold">Inicial</span>
                  </div>
                  <p className="text-sm font-bold text-white">
                    {formatCurrency(auction.initial_bid_value)}
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <Zap size={14} className="text-gray-300" />
                    <span className="text-xs text-gray-300 uppercase font-semibold">Lances</span>
                  </div>
                  <p className="text-sm font-bold text-white">
                    {loading ? '...' : (stats?.totalBids || 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-primary/40 backdrop-blur-sm rounded-2xl p-4 border border-primary/50">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <TrendingUp size={14} className="text-primary-foreground" />
                  <span className="text-xs text-primary-foreground uppercase font-semibold">
                    {hasWinner ? 'Final' : 'Atual'}
                  </span>
                </div>
                <p className="text-lg font-bold text-primary-foreground">
                  {formatCurrency(finalCurrentValue)}
                </p>
              </div>
            </div>

            {/* Timeline with Progress Bar */}
            {auction.start_date && (
              <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-3 border border-white/20">
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-1">
                    <Clock size={12} className="text-blue-400" />
                    <span className="text-gray-300">Programação</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${timeInfo.isFinished ? 'bg-green-400' : 'bg-blue-400 animate-pulse'}`}></div>
                    <span className={`font-semibold ${timeInfo.isFinished ? 'text-green-400' : 'text-blue-400'}`}>
                      {timeInfo.isFinished ? 'Finalizado' : 'Em Andamento'}
                    </span>
                  </div>
                </div>
                
                {/* Programming times */}
                <div className="flex flex-col gap-1 text-xs text-gray-300">
                  <div className="flex justify-between">
                    <span>Início:</span>
                    <span>{new Date(auction.start_date).toLocaleDateString('pt-BR', { 
                      day: '2-digit', 
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                  {auction.end_date && (
                    <div className="flex justify-between">
                      <span>Fim:</span>
                      <span>{new Date(auction.end_date).toLocaleDateString('pt-BR', { 
                        day: '2-digit', 
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="mt-auto">
            <div className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary backdrop-blur-sm border border-primary/30 rounded-2xl py-4 px-6 text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25">
              <div className="flex items-center justify-center gap-3 text-primary-foreground">
                <Play size={18} fill="currentColor" />
                <span className="text-base font-bold">Acessar Leilão</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default AuctionChannelCard;