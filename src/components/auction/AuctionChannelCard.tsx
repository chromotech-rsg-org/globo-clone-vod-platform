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

  return (
    <Link to={`/auctions/${auction.id}`} className="block h-full">
      <Card className="group relative overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 hover:border-primary/50 rounded-3xl w-full aspect-[9/16]">
        {/* Background Image - Full coverage */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-500"
          style={{
            backgroundImage: `url('${auction.image_url || '/assets/auction-channel-bg-mobile.jpg'}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
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

          {/* Auction name at bottom */}
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-white text-lg font-bold truncate drop-shadow-lg">
              {auction.name}
            </h3>
          </div>
        </div>

        {/* Hover Content - Full info */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 p-6 flex flex-col">
          {/* Header with auction name */}
          <div className="text-center mb-4">
            <h3 className="text-white text-xl font-bold mb-2 leading-tight">
              {auction.name}
            </h3>
            
            {/* Lot info */}
            <div className="flex items-center justify-center gap-4 text-white/90 text-sm">
              <div className="flex items-center gap-1">
                <Package size={16} />
                <span>{totalLots} {totalLots === 1 ? 'Lote' : 'Lotes'}</span>
              </div>
              {currentLot && (
                <div className="flex items-center gap-1">
                  <Play size={16} className="text-green-400" />
                  <span className="text-green-400">Lote: {currentLot.name}</span>
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

          {/* Stats Grid - Better spacing and sizing */}
          <div className="grid grid-cols-1 gap-4 mb-6 flex-1 justify-center items-center">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-white/10 text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Target size={16} className="text-gray-300" />
                  <span className="text-sm text-gray-300">Inicial</span>
                </div>
                <p className="text-base font-bold text-white">
                  {formatCurrency(auction.initial_bid_value)}
                </p>
              </div>
              
              <div className="bg-primary/30 backdrop-blur-sm rounded-xl p-4 border border-primary/40 text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <TrendingUp size={16} className="text-primary" />
                  <span className="text-sm text-primary">
                    {hasWinner ? 'Final' : 'Atual'}
                  </span>
                </div>
                <p className="text-base font-bold text-primary">
                  {formatCurrency(finalCurrentValue)}
                </p>
              </div>
              
              <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-white/10 text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Zap size={16} className="text-gray-300" />
                  <span className="text-sm text-gray-300">Lances</span>
                </div>
                <p className="text-base font-bold text-white">
                  {loading ? '...' : (stats?.totalBids || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-auto">
            <div className="w-full bg-primary/30 backdrop-blur-sm border border-primary/50 rounded-xl py-4 px-6 text-center hover:bg-primary/40 transition-colors">
              <div className="flex items-center justify-center gap-3 text-primary">
                <Play size={20} />
                <span className="text-lg font-semibold">Acessar Leilão</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default AuctionChannelCard;