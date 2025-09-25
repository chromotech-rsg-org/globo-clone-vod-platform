
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
    <Link to={`/auctions/${auction.id}`} className="block h-full">
      <Card className="group hover:shadow-2xl transition-all duration-300 cursor-pointer h-[400px] flex flex-col bg-gradient-to-br from-gray-900/80 to-black/60 border-green-600/30 hover:border-green-500/60 hover:scale-[1.02] relative overflow-hidden">
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <CardContent className="p-4 flex-1 flex flex-col relative z-10">
          {/* Header com badges - altura fixa aumentada para acomodar o badge finalizado */}
          <div className="flex items-start justify-between mb-3 h-[80px]">
            <div className="flex-1 pr-2 min-w-0">
              <h3 className="text-base font-semibold text-white mb-2 line-clamp-2 leading-tight group-hover:text-green-300 transition-colors break-words h-[44px] overflow-hidden">
                {auction.name}
              </h3>
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0 min-w-[100px]">
              <Badge 
                variant={auction.is_live ? "default" : "secondary"}
                className={`flex items-center gap-1 whitespace-nowrap text-xs px-2 py-1 ${
                  auction.is_live 
                    ? 'bg-red-500 text-white animate-pulse border-red-400' 
                    : 'bg-gray-700 text-gray-300 border-gray-600'
                }`}
              >
                {auction.is_live ? (
                  <>
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                    <span>AO VIVO</span>
                  </>
                ) : (
                  <>
                    <Square size={10} />
                    <span>GRAVADO</span>
                  </>
                )}
              </Badge>
              
              <Badge 
                variant="outline" 
                className="whitespace-nowrap border-green-600/50 text-green-400 bg-green-500/10 text-xs px-2 py-1"
              >
                {auction.auction_type === 'rural' ? (
                  <>🌾 Rural</>
                ) : (
                  <>⚖️ Judicial</>
                )}
              </Badge>
              
              {auction.allow_pre_bidding && (
                <Badge 
                  variant="outline" 
                  className="whitespace-nowrap border-yellow-600/50 text-yellow-400 bg-yellow-500/10 text-xs px-2 py-1 flex items-center gap-1"
                >
                  <Target size={10} />
                  Pré Lance
                </Badge>
              )}
              
              {hasWinner && (
                <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white flex items-center gap-1 whitespace-nowrap animate-pulse text-xs px-2 py-1">
                  <Trophy size={10} />
                  Finalizado
                </Badge>
              )}
            </div>
          </div>

          {/* Descrição - altura reduzida para dar espaço aos badges */}
          <div className="mb-3 h-[28px] overflow-hidden">
            {auction.description ? (
              <p className="text-sm text-gray-300 line-clamp-1 break-words">
                {auction.description}
              </p>
            ) : (
              <div className="h-[28px]"></div>
            )}
          </div>

          {/* Valores - altura fixa */}
          <div className="grid grid-cols-3 gap-2 mb-4 h-[70px]">
            <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700/50 min-w-0 flex flex-col">
              <p className="text-xs text-gray-400 uppercase tracking-wide flex items-center gap-1 mb-1.5 truncate">
                <Target size={8} />
                Inicial
              </p>
              <p className="text-xs font-medium text-gray-300 truncate">
                {formatCurrency(auction.initial_bid_value)}
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-lg p-2 border border-green-600/30 min-w-0 flex flex-col">
              <p className="text-xs text-green-400 uppercase tracking-wide mb-1.5 truncate">
                {hasWinner ? 'Arrematado' : 'Lance Atual'}
              </p>
              <p className={`text-sm font-bold truncate ${hasWinner ? 'text-green-400' : 'text-white'}`}>
                {formatCurrency(finalCurrentValue)}
              </p>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700/50 min-w-0 flex flex-col">
              <p className="text-xs text-gray-400 uppercase tracking-wide flex items-center gap-1 mb-1.5 truncate">
                <Zap size={8} />
                Lances
              </p>
              <p className="text-xs font-medium text-white truncate">
                {loading ? '...' : (stats?.totalBids || 0)}
              </p>
            </div>
          </div>

          {/* Data e progresso - posicionado na parte inferior */}
          <div className="mt-auto pt-3 border-t border-gray-700/50 h-[120px] flex flex-col justify-between">
            {(auction.start_date || auction.end_date) ? (
              <div className="text-xs text-gray-400 space-y-2 flex-1 flex flex-col justify-between">
                {auction.start_date && auction.end_date ? (
                  <>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Clock size={10} />
                        <span className="font-medium text-gray-300 truncate">
                          {new Date(auction.start_date).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs text-gray-400">
                          {new Date(auction.start_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })} - {new Date(auction.end_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}
                        </div>
                      </div>
                    </div>
                    
                    {/* Barra de Progresso */}
                    {(() => {
                      const now = new Date().getTime();
                      const start = new Date(auction.start_date).getTime();
                      const end = new Date(auction.end_date).getTime();
                      const totalDuration = end - start;
                      const elapsed = Math.max(0, now - start);
                      const progress = Math.min(100, (elapsed / totalDuration) * 100);
                      
                      return (
                        <div className="space-y-1.5">
                          <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-1.5 rounded-full transition-all duration-500 ${
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
                  <div className="truncate">Início: {new Date(auction.start_date).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</div>
                ) : auction.end_date ? (
                  <div className="truncate">Fim: {new Date(auction.end_date).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</div>
                ) : null}
              </div>
            ) : (
              <div className="h-full"></div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default AuctionCard;
