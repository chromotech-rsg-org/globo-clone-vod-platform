
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuctions } from '@/hooks/useAuctions';
import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck';
import { useAuth } from '@/contexts/AuthContext';
import AuctionChannelCard from '@/components/auction/AuctionChannelCard';
import PreBiddingLotSelector from '@/components/auction/PreBiddingLotSelector';
import SubscriptionRequired from '@/components/SubscriptionRequired';
import AuctionPromoBanner from '@/components/auction/AuctionPromoBanner';
import GuestModeBanner from '@/components/auction/GuestModeBanner';
import { Skeleton } from '@/components/ui/skeleton';
import { Gavel, Trophy, Play, Target, TrendingUp, Users, Calendar, Award } from 'lucide-react';

const AuctionHome = () => {
  const { auctions, loading } = useAuctions();
  const { hasActiveSubscription, loading: subscriptionLoading } = useSubscriptionCheck();
  const { user } = useAuth();

  const liveAuctions = auctions.filter(auction => auction.is_live);
  const recordedAuctions = auctions.filter(auction => !auction.is_live);
  const preBiddingAuctions = auctions.filter(auction => auction.allow_pre_bidding && !auction.is_live);

  console.log('🏠 AuctionHome: Current state:', {
    user: user ? { email: user.email, role: user.role } : null,
    hasActiveSubscription,
    subscriptionLoading,
    auctionsCount: auctions.length
  });

  // Check subscription, but allow admin/developer bypass
  if (!subscriptionLoading && hasActiveSubscription === false) {
    // Double-check: admins and developers should always have access
    if (user?.role === 'admin' || user?.role === 'desenvolvedor') {
      console.log('🔓 AuctionHome: Admin/Developer override - allowing access');
    } else {
      console.log('🔒 AuctionHome: No subscription, showing SubscriptionRequired');
      return <SubscriptionRequired />;
    }
  }

  if (loading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-900 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Promo Banner with home menus - more compact */}
      <AuctionPromoBanner />

      {/* Guest Mode Banner - show only if user is not logged in */}
      {!user && <GuestModeBanner className="container mx-auto px-4 mt-4" />}
      
      {/* Agroplay Button */}
      <div className="container mx-auto px-2 sm:px-4 pt-4 pb-2">
        <a
          href="https://portal.agroplay.tv.br/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-colors font-medium text-sm sm:text-base shadow-lg"
        >
          <span>Acessar Agroplay</span>
        </a>
      </div>

      {/* Content */}
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <Tabs defaultValue="live" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-8 bg-gray-900 border border-green-600/30 text-xs sm:text-sm p-0">
            <TabsTrigger 
              value="live" 
              className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-300 px-2 py-2 rounded-none first:rounded-l-md last:rounded-r-md m-0"
            >
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="hidden sm:inline">Leilões ao Vivo</span>
              <span className="sm:hidden">Ao Vivo</span>
              {liveAuctions.length > 0 && (
                <span className="bg-red-500 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ml-1">
                  {liveAuctions.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="pre-bidding" 
              className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-300 px-2 py-2 rounded-none first:rounded-l-md last:rounded-r-md m-0"
            >
              <Target size={14} className="sm:w-4 sm:h-4" />
              <span>Pré Lance</span>
              {preBiddingAuctions.length > 0 && (
                <span className="bg-yellow-500 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ml-1">
                  {preBiddingAuctions.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="recorded" 
              className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-300 px-2 py-2 rounded-none first:rounded-l-md last:rounded-r-md m-0"
            >
              <Trophy size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Transmissões Encerradas</span>
              <span className="sm:hidden">Encerradas</span>
              {recordedAuctions.length > 0 && (
                <span className="bg-gray-600 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ml-1">
                  {recordedAuctions.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="space-y-6">
            {liveAuctions.length === 0 ? (
              <Card className="text-center py-16 bg-gradient-to-br from-gray-900/80 to-black/60 border-green-600/30">
                <CardContent>
                  <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Gavel size={32} className="text-gray-500" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-4">
                    Nenhum leilão ao vivo
                  </h3>
                  <p className="text-gray-400 text-lg">
                    No momento não há leilões sendo transmitidos ao vivo.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-2 sm:px-4">
                {liveAuctions.map((auction) => (
                  <div key={auction.id} className="w-full">
                    <AuctionChannelCard auction={auction} />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pre-bidding" className="space-y-6">
            {preBiddingAuctions.length === 0 ? (
              <Card className="text-center py-16 bg-gradient-to-br from-gray-900/80 to-black/60 border-green-600/30">
                <CardContent>
                  <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Target size={32} className="text-gray-500" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-4">
                    Nenhum leilão com pré lance
                  </h3>
                  <p className="text-gray-400 text-lg">
                    No momento não há leilões disponíveis para pré lance.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-2 sm:px-4">
                {preBiddingAuctions.map((auction) => (
                  <div key={auction.id} className="w-full">
                    <AuctionChannelCard auction={auction} />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recorded" className="space-y-6">
            {recordedAuctions.length === 0 ? (
              <Card className="text-center py-16 bg-gradient-to-br from-gray-900/80 to-black/60 border-green-600/30">
                <CardContent>
                  <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Trophy size={32} className="text-gray-500" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-4">
                    Nenhuma transmissão disponível
                  </h3>
                  <p className="text-gray-400 text-lg">
                    Ainda não há gravações de leilões disponíveis.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-2 sm:px-4">
                {recordedAuctions.map((auction) => (
                  <div key={auction.id} className="w-full">
                    <AuctionChannelCard auction={auction} />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AuctionHome;
