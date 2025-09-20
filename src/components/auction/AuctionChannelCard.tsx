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
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 p-4 flex flex-col">
          {/* Header with auction name */}
          <div className="text-center mb-3">
            <h3 className="text-white text-lg font-bold leading-tight">
              {auction.name}
            </h3>
          </div>

          {/* Comprehensive Lot Information */}
          <div className="flex-1 space-y-2 mb-3">
            {/* Lot Summary */}
            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Package size={14} className="text-blue-400" />
                <span className="text-white font-semibold text-sm">Resumo dos Lotes</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-blue-400 font-bold text-base">{totalLots}</div>
                  <div className="text-xs text-gray-300">Total</div>
                </div>
                <div>
                  <div className="text-green-400 font-bold text-base">
                    {lots?.filter(lot => lot.status === 'finished').length || 0}
                  </div>
                  <div className="text-xs text-gray-300">Finalizados</div>
                </div>
                <div>
                  <div className="text-yellow-400 font-bold text-base">
                    {lots?.filter(lot => lot.status === 'in_progress').length || 0}
                  </div>
                  <div className="text-xs text-gray-300">Em Andamento</div>
                </div>
              </div>
            </div>

            {/* Current Lot Details */}
            {currentLot && (
              <div className="bg-green-900/30 backdrop-blur-sm rounded-lg p-3 border border-green-600/50">
                <div className="flex items-center gap-2 mb-2">
                  <Play size={14} className="text-green-400" />
                  <span className="text-green-400 font-semibold text-sm">Lote Atual:</span>
                  <span className="text-white font-semibold text-sm truncate flex-1">{currentLot.name}</span>
                </div>
                
                
                <div className="flex justify-between items-center text-xs">
                  <div className="text-center">
                    <div className="text-gray-300">Inicial</div>
                    <div className="text-white font-medium">{formatCurrency(currentLot.initial_value)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-300">Atual</div>
                    <div className="text-green-400 font-bold">{formatCurrency(currentLot.current_value)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-300">Lances</div>
                    <div className="text-white font-medium">{loading ? '...' : (stats?.totalBids || 0)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Finished Lots */}
            <div className="bg-gray-900/40 backdrop-blur-sm rounded-lg p-3 border border-gray-600/30">
              <div className="flex items-center gap-2 mb-2">
                <Trophy size={14} className="text-yellow-400" />
                <span className="text-yellow-400 font-semibold text-sm">Lotes Finalizados</span>
              </div>
              
              {(() => {
                const finishedLots = lots?.filter(lot => lot.status === 'finished') || [];
                
                if (finishedLots.length === 0) {
                  return (
                    <div className="text-center py-1">
                      <div className="text-gray-400 text-xs">
                        Nenhum lote finalizado ainda
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-1 max-h-16 overflow-y-auto">
                    {finishedLots.map((lot) => (
                      <div key={lot.id} className="flex justify-between items-center text-xs">
                        <div className="text-white font-medium truncate flex-1 mr-2">
                          {lot.name}
                        </div>
                        <div className="text-yellow-400 font-bold">
                          {formatCurrency(lot.current_value)}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Timeline with Progress Bar */}
            {auction.start_date && (
              <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-blue-400" />
                    <span className="text-white font-semibold text-sm">Programação</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${timeInfo.isFinished ? 'bg-green-400' : 'bg-blue-400 animate-pulse'}`}></div>
                    <span className={`font-semibold text-xs ${timeInfo.isFinished ? 'text-green-400' : 'text-blue-400'}`}>
                      {timeInfo.isFinished ? 'Finalizado' : 'Em Andamento'}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                {(() => {
                  const startDate = new Date(auction.start_date);
                  const endDate = auction.end_date ? new Date(auction.end_date) : null;
                  const now = new Date();
                  
                  let progress = 0;
                  let timeDisplay = '';
                  
                  if (timeInfo.isFinished) {
                    progress = 100;
                    if (endDate) {
                      const executionMs = endDate.getTime() - startDate.getTime();
                      const executionHours = Math.floor(executionMs / (1000 * 60 * 60));
                      const executionMinutes = Math.floor((executionMs % (1000 * 60 * 60)) / (1000 * 60));
                      timeDisplay = executionHours > 0 ? `${executionHours}h ${executionMinutes}min` : `${executionMinutes}min`;
                    } else {
                      const executionMs = now.getTime() - startDate.getTime();
                      const executionHours = Math.floor(executionMs / (1000 * 60 * 60));
                      const executionMinutes = Math.floor((executionMs % (1000 * 60 * 60)) / (1000 * 60));
                      timeDisplay = executionHours > 0 ? `${executionHours}h ${executionMinutes}min` : `${executionMinutes}min`;
                    }
                  } else {
                    const elapsedMs = now.getTime() - startDate.getTime();
                    const elapsedHours = Math.floor(elapsedMs / (1000 * 60 * 60));
                    const elapsedMinutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));
                    timeDisplay = elapsedHours > 0 ? `${elapsedHours}h ${elapsedMinutes}min` : `${elapsedMinutes}min`;
                    
                    if (endDate) {
                      const totalDurationMs = endDate.getTime() - startDate.getTime();
                      progress = totalDurationMs > 0 ? Math.min((elapsedMs / totalDurationMs) * 100, 100) : 0;
                    } else {
                      const assumedDuration = 2 * 60 * 60 * 1000;
                      progress = Math.min((elapsedMs / assumedDuration) * 100, 90);
                    }
                  }
                  
                  return (
                    <>
                      <div className="w-full bg-gray-700 rounded-full h-2 mb-2 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            timeInfo.isFinished 
                              ? 'bg-gradient-to-r from-green-500 to-green-400' 
                              : 'bg-gradient-to-r from-blue-500 to-blue-400'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      
                      <div className="text-center mb-2">
                        <div className="text-gray-300 text-xs">
                          {timeInfo.isFinished ? 'Tempo total:' : 'Decorrido:'} 
                          <span className={`font-bold ml-1 ${timeInfo.isFinished ? 'text-green-400' : 'text-blue-400'}`}>
                            {timeDisplay}
                          </span>
                        </div>
                      </div>
                    </>
                  );
                })()}
                
                {/* Programming dates and times */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Início:</span>
                    <span className="text-white text-xs">
                      {new Date(auction.start_date).toLocaleDateString('pt-BR', { 
                        day: '2-digit', 
                        month: '2-digit'
                      })} {new Date(auction.start_date).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {auction.end_date && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">
                        {timeInfo.isFinished ? 'Fim:' : 'Prev.:'}
                      </span>
                      <span className={`text-xs ${timeInfo.isFinished ? 'text-green-400' : 'text-white'}`}>
                        {new Date(auction.end_date).toLocaleDateString('pt-BR', { 
                          day: '2-digit', 
                          month: '2-digit'
                        })} {new Date(auction.end_date).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="mt-auto">
            <div className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary backdrop-blur-sm border border-primary/30 rounded-xl py-3 px-4 text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25">
              <div className="flex items-center justify-center gap-2 text-primary-foreground">
                <Play size={16} fill="currentColor" />
                <span className="text-sm font-bold">Acessar Leilão</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default AuctionChannelCard;