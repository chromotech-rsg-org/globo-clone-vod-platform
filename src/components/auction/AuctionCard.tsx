
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Auction } from '@/types/auction';
import { formatCurrency } from '@/utils/formatters';
import { Play, Square, Trophy, Target, Clock, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuctionStats } from '@/hooks/useAuctionStats';

interface AuctionCardProps {
  auction: Auction;
}

const AuctionCard = ({ auction }: AuctionCardProps) => {
  const { stats, loading } = useAuctionStats(auction.id);

  // Calcular valores finais baseados no leilão real
  const finalCurrentValue = stats?.winnerBidValue || auction.current_bid_value;
  const hasWinner = stats?.hasWinner || false;

  return (
    <Link to={`/auctions/${auction.id}`}>
      <Card className="group hover:shadow-2xl transition-all duration-300 cursor-pointer h-full flex flex-col bg-gradient-to-br from-gray-900/80 to-black/60 border-green-600/30 hover:border-green-500/60 hover:scale-[1.02] relative overflow-hidden">
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <CardContent className="p-6 flex-1 flex flex-col relative z-10">
          {/* Header com badges - altura fixa */}
          <div className="flex items-start justify-between mb-4 min-h-[60px]">
            <div className="flex-1 pr-2">
              <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 min-h-[56px] group-hover:text-green-300 transition-colors">
                {auction.name}
              </h3>
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <Badge 
                variant={auction.is_live ? "default" : "secondary"}
                className={`flex items-center gap-1 whitespace-nowrap ${
                  auction.is_live 
                    ? 'bg-red-500 text-white animate-pulse border-red-400' 
                    : 'bg-gray-700 text-gray-300 border-gray-600'
                }`}
              >
                {auction.is_live ? (
                  <>
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span>AO VIVO</span>
                  </>
                ) : (
                  <>
                    <Square size={12} />
                    <span>GRAVADO</span>
                  </>
                )}
              </Badge>
              
              <Badge 
                variant="outline" 
                className="whitespace-nowrap border-green-600/50 text-green-400 bg-green-500/10"
              >
                {auction.auction_type === 'rural' ? (
                  <>🌾 Rural</>
                ) : (
                  <>⚖️ Judicial</>
                )}
              </Badge>
              
              {hasWinner && (
                <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white flex items-center gap-1 whitespace-nowrap animate-pulse">
                  <Trophy size={12} />
                  Finalizado
                </Badge>
              )}
            </div>
          </div>

          {/* Descrição - altura controlada */}
          {auction.description && (
            <div className="mb-4 min-h-[40px]">
              <p className="text-sm text-gray-300 line-clamp-2">
                {auction.description}
              </p>
            </div>
          )}

          {/* Valores - altura fixa com design melhorado */}
          <div className="grid grid-cols-3 gap-3 mb-6 min-h-[80px]">
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
              <p className="text-xs text-gray-400 uppercase tracking-wide flex items-center gap-1 mb-2">
                <Target size={10} />
                Inicial
              </p>
              <p className="text-sm font-medium text-gray-300">
                {formatCurrency(auction.initial_bid_value)}
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-lg p-3 border border-green-600/30">
              <p className="text-xs text-green-400 uppercase tracking-wide mb-2">
                {hasWinner ? 'Arrematado' : 'Lance Atual'}
              </p>
              <p className={`text-lg font-bold ${hasWinner ? 'text-green-400' : 'text-white'}`}>
                {formatCurrency(finalCurrentValue)}
              </p>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
              <p className="text-xs text-gray-400 uppercase tracking-wide flex items-center gap-1 mb-2">
                <Zap size={10} />
                Lances
              </p>
              <p className="text-sm font-medium text-white">
                {loading ? '...' : (stats?.totalBids || 0)}
              </p>
            </div>
          </div>

          {/* Data e progresso - margem automática para empurrar para baixo */}
          {(auction.start_date || auction.end_date) && (
            <div className="mt-auto pt-4 border-t border-gray-700/50">
              <div className="text-xs text-gray-400 space-y-3">
                {auction.start_date && auction.end_date ? (
                  <>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Clock size={12} />
                        <span className="font-medium text-gray-300">
                          {new Date(auction.start_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-400">
                          {new Date(auction.start_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {new Date(auction.end_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    
                    {/* Barra de Progresso melhorada */}
                    {(() => {
                      const now = new Date().getTime();
                      const start = new Date(auction.start_date).getTime();
                      const end = new Date(auction.end_date).getTime();
                      const totalDuration = end - start;
                      const elapsed = Math.max(0, now - start);
                      const progress = Math.min(100, (elapsed / totalDuration) * 100);
                      
                      return (
                        <div className="space-y-2">
                          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-2 rounded-full transition-all duration-500 ${
                                now < start ? 'bg-blue-500' : 
                                now > end ? 'bg-gray-500' : 
                                'bg-gradient-to-r from-green-400 to-green-600'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="text-center text-xs">
                            {now < start ? (
                              <span className="text-blue-400 font-medium">⏱️ Não iniciado</span>
                            ) : now > end ? (
                              <span className="text-gray-400 font-medium">✅ Finalizado</span>
                            ) : (
                              <span className="text-green-400 font-medium">🔴 {Math.round(progress)}% concluído</span>
                            )}
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
