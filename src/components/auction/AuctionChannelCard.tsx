import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Auction } from '@/types/auction';
import { formatCurrency } from '@/utils/formatters';
import { Play, Square, Trophy, Target, Clock, Zap, TrendingUp, Package, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuctionStats } from '@/hooks/useAuctionStats';
import { useAuctionItems } from '@/hooks/useAuctionItems';

interface AuctionChannelCardProps {
  auction: Auction;
}

const AuctionChannelCard = ({ auction }: AuctionChannelCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const { stats, loading } = useAuctionStats(auction.id);
  const { items: lots, loading: lotsLoading } = useAuctionItems(auction.id);

  const finalCurrentValue = stats?.winnerBidValue || auction.current_bid_value;
  const hasWinner = stats?.hasWinner || false;
  const currentLot = lots?.find(lot => lot.is_current) || lots?.find(lot => lot.status === 'in_progress') || null;
  const totalLots = lots?.length || 0;

  // Calculate time progress based on start and end dates
  const calculateTimeProgress = () => {
    if (!auction.start_date) return { progress: 0, timeText: 'Sem programação', isFinished: hasWinner };
    
    // Create dates and handle Brazil timezone properly
    const startDate = new Date(auction.start_date + (auction.start_date.includes('T') ? '' : 'T00:00:00'));
    const endDate = auction.end_date ? new Date(auction.end_date + (auction.end_date.includes('T') ? '' : 'T00:00:00')) : null;
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
    <div className="block h-full relative">
      <Link to={`/auctions/${auction.id}`} className="block h-full">
        <Card className="group relative overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 hover:border-primary/50 rounded-2xl sm:rounded-3xl w-full aspect-[2/3]">
        {/* Background Image - Full coverage with rounded corners */}
        <div 
          className="absolute inset-0 transition-all duration-500 rounded-2xl sm:rounded-3xl overflow-hidden"
          style={{
            backgroundImage: `url('${auction.image_url || '/assets/auction-channel-bg-mobile.jpg'}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        
        {/* Gradient overlay */}
        <div className={`absolute inset-0 transition-all duration-500 ${
          isFlipped 
            ? 'bg-black/90 md:bg-gradient-to-t md:from-black/40 md:via-transparent md:to-black/20 md:group-hover:from-black/95 md:group-hover:via-black/80 md:group-hover:to-black/70' 
            : 'bg-gradient-to-t from-black/40 via-transparent to-black/20 group-hover:from-black/95 group-hover:via-black/80 group-hover:to-black/70'
        }`} />
        
        {/* Mobile Flip Button - Only visible on mobile, not on hover */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsFlipped(!isFlipped);
          }}
          className="md:hidden absolute bottom-3 right-3 z-40 bg-black/70 hover:bg-black/90 backdrop-blur-sm text-white p-2.5 rounded-full border border-white/30 transition-all shadow-lg"
        >
          {isFlipped ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>

        {/* Default visible content - Only badges */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${isFlipped ? 'md:group-hover:opacity-0 opacity-0' : 'group-hover:opacity-0'}`}>
          {/* Live Indicator */}
          {auction.is_live && (
            <div className="absolute top-2 sm:top-3 lg:top-4 left-2 sm:left-3 lg:left-4 z-30">
              <Badge className="bg-red-500 text-white animate-pulse border-red-400 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1.5 sm:gap-2 shadow-lg">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse"></div>
                <span className="hidden sm:inline">AO VIVO</span>
                <span className="sm:hidden">VIVO</span>
              </Badge>
            </div>
          )}

          {/* Winner Badge */}
          {hasWinner && (
            <div className="absolute top-2 sm:top-3 lg:top-4 right-2 sm:right-3 lg:right-4 z-30">
              <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 shadow-lg">
                <Trophy size={12} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">FINALIZADO</span>
                <span className="sm:hidden">FIM</span>
              </Badge>
            </div>
          )}

          {/* Pre-bidding Badge */}
          {auction.allow_pre_bidding && !hasWinner && (
            <div className="absolute top-2 sm:top-3 lg:top-4 right-2 sm:right-3 lg:right-4 z-30">
              <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 shadow-lg">
                <Target size={12} className="sm:w-4 sm:h-4" />
                <span>PRÉ LANCE</span>
              </Badge>
            </div>
          )}
        </div>

        {/* Hover Content - Full info (desktop hover or mobile flipped) */}
        <div className={`absolute inset-0 transition-all duration-300 p-2 sm:p-3 lg:p-4 flex flex-col overflow-y-auto ${isFlipped ? 'opacity-100 md:opacity-0 md:group-hover:opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {/* Header with auction name */}
          <div className="text-center mb-2 sm:mb-3">
            <h3 className="text-white text-sm sm:text-base lg:text-lg font-bold leading-tight break-words">
              {auction.name}
            </h3>
          </div>

          {/* Comprehensive Lot Information */}
          <div className="flex-1 space-y-1.5 sm:space-y-2 mb-2 sm:mb-3 overflow-y-auto">
            {/* Lot Summary */}
            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-2 sm:p-2.5 lg:p-3 border border-white/20">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <Package size={12} className="sm:w-3.5 sm:h-3.5 text-blue-400 flex-shrink-0" />
                <span className="text-white font-semibold text-xs sm:text-sm">Resumo dos Lotes</span>
              </div>
              
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
                <div>
                  <div className="text-blue-400 font-bold text-sm sm:text-base">{totalLots}</div>
                  <div className="text-[10px] sm:text-xs text-gray-300">Total</div>
                </div>
                <div>
                  <div className="text-green-400 font-bold text-sm sm:text-base">
                    {lots?.filter(lot => lot.status === 'finished').length || 0}
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-300 break-words">Finalizados</div>
                </div>
                <div>
                  <div className="text-yellow-400 font-bold text-sm sm:text-base">
                    {lots?.filter(lot => lot.status === 'in_progress').length || 0}
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-300 break-words">Andamento</div>
                </div>
              </div>
            </div>

            {/* Current Lot Details */}
            <div className="bg-green-900/30 backdrop-blur-sm rounded-lg p-3 border border-green-600/50">
              {currentLot ? (
                <>
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
                </>
              ) : (
                <div className="text-center py-2">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Play size={14} className="text-gray-400" />
                    <span className="text-gray-400 font-semibold text-sm">Nenhum lote iniciado</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Aguardando início do primeiro lote
                  </div>
                </div>
              )}
            </div>

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
                    <div className={`w-2 h-2 rounded-full ${
                      (() => {
                        const now = new Date();
                        const startDate = new Date(auction.start_date + (auction.start_date.includes('T') ? '' : 'T00:00:00'));
                        const elapsedMs = now.getTime() - startDate.getTime();
                        
                        if (elapsedMs < 0) {
                          return 'bg-gray-400';
                        } else if (timeInfo.isFinished) {
                          return 'bg-green-400';
                        } else {
                          return 'bg-blue-400 animate-pulse';
                        }
                      })()
                    }`}></div>
                    <span className={`font-semibold text-xs ${
                      (() => {
                        const now = new Date();
                        const startDate = new Date(auction.start_date + (auction.start_date.includes('T') ? '' : 'T00:00:00'));
                        const elapsedMs = now.getTime() - startDate.getTime();
                        
                        if (elapsedMs < 0) {
                          return 'text-gray-400';
                        } else if (timeInfo.isFinished) {
                          return 'text-green-400';
                        } else {
                          return 'text-blue-400';
                        }
                      })()
                    }`}>
                      {(() => {
                        const now = new Date();
                        const startDate = new Date(auction.start_date + (auction.start_date.includes('T') ? '' : 'T00:00:00'));
                        const elapsedMs = now.getTime() - startDate.getTime();
                        
                        if (elapsedMs < 0) {
                          return 'Não iniciado';
                        } else if (timeInfo.isFinished) {
                          return 'Finalizado';
                        } else {
                          return 'Em Andamento';
                        }
                      })()}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                {(() => {
                  // Create dates with proper timezone handling
                  const startDate = new Date(auction.start_date + (auction.start_date.includes('T') ? '' : 'T00:00:00'));
                  const endDate = auction.end_date ? new Date(auction.end_date + (auction.end_date.includes('T') ? '' : 'T00:00:00')) : null;
                  const now = new Date();
                  
                  // Debug logging
                  console.log('Auction times:', {
                    original_start: auction.start_date,
                    original_end: auction.end_date,
                    parsed_start: startDate.toString(),
                    parsed_end: endDate?.toString(),
                    now: now.toString(),
                    elapsed_ms: now.getTime() - startDate.getTime(),
                    elapsed_minutes: Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60))
                  });
                  
                  let progress = 0;
                  let timeDisplay = '';
                  
                  // Check if auction hasn't started yet
                  const elapsedMs = now.getTime() - startDate.getTime();
                  
                  if (elapsedMs < 0) {
                    // Auction hasn't started yet
                    progress = 0;
                    const absMs = Math.abs(elapsedMs);
                    const absHours = Math.floor(absMs / (1000 * 60 * 60));
                    const absMinutes = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));
                    timeDisplay = absHours > 0 ? `${absHours}h ${absMinutes}min` : `${absMinutes}min`;
                  } else if (timeInfo.isFinished) {
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
                            (() => {
                              const now = new Date();
                              const startDate = new Date(auction.start_date + (auction.start_date.includes('T') ? '' : 'T00:00:00'));
                              const elapsedMs = now.getTime() - startDate.getTime();
                              
                              if (elapsedMs < 0) {
                                return 'bg-gray-400'; // Not started yet
                              } else if (timeInfo.isFinished) {
                                return 'bg-gradient-to-r from-green-500 to-green-400';
                              } else {
                                return 'bg-gradient-to-r from-blue-500 to-blue-400';
                              }
                            })()
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      
                       <div className="text-center mb-2">
                         <div className="text-gray-300 text-xs">
                           {(() => {
                             const now = new Date();
                             const startDate = new Date(auction.start_date + (auction.start_date.includes('T') ? '' : 'T00:00:00'));
                             const elapsedMs = now.getTime() - startDate.getTime();
                             
                             if (elapsedMs < 0) {
                               return 'Começa em:';
                             } else if (timeInfo.isFinished) {
                               return 'Tempo de transmissão:';
                             } else {
                               return 'Em Andamento:';
                             }
                           })()} 
                           <span className={`font-bold ml-1 ${
                             (() => {
                               const now = new Date();
                               const startDate = new Date(auction.start_date + (auction.start_date.includes('T') ? '' : 'T00:00:00'));
                               const elapsedMs = now.getTime() - startDate.getTime();
                               
                               if (elapsedMs < 0) {
                                 return 'text-gray-400';
                               } else if (timeInfo.isFinished) {
                                 return 'text-green-400';
                               } else {
                                 return 'text-blue-400';
                               }
                             })()
                           }`}>
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
                        month: '2-digit',
                        timeZone: 'America/Sao_Paulo'
                      })} {new Date(auction.start_date).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'America/Sao_Paulo'
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
                          month: '2-digit',
                          timeZone: 'America/Sao_Paulo'
                        })} {new Date(auction.end_date).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: 'America/Sao_Paulo'
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
    </div>
  );
};

export default AuctionChannelCard;