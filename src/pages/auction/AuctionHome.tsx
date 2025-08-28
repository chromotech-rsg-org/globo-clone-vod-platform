
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuctions } from '@/hooks/useAuctions';
import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck';
import { useAuth } from '@/contexts/AuthContext';
import AuctionCard from '@/components/auction/AuctionCard';
import SubscriptionRequired from '@/components/SubscriptionRequired';
import AuctionPromoBanner from '@/components/auction/AuctionPromoBanner';
import { Skeleton } from '@/components/ui/skeleton';
import { Gavel, Trophy, Play, Target, TrendingUp, Users, Calendar, Award } from 'lucide-react';

const AuctionHome = () => {
  const { auctions, loading } = useAuctions();
  const { hasActiveSubscription, loading: subscriptionLoading } = useSubscriptionCheck();
  const { user } = useAuth();

  const liveAuctions = auctions.filter(auction => auction.is_live);
  const recordedAuctions = auctions.filter(auction => !auction.is_live);

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
      {/* Promo Banner - mais atrativo como na home */}
      <AuctionPromoBanner />

      {/* Hero Section aprimorada */}
      <div className="bg-gradient-to-br from-black via-gray-900 to-black border-b border-green-600/30">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center relative">
            {/* Background pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(22,163,74,0.1),transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(22,163,74,0.05)_50%,transparent_75%)]"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl"></div>
                  <div className="relative p-4 bg-gradient-to-br from-green-500/20 to-green-600/30 rounded-2xl border border-green-500/40">
                    <Gavel className="h-12 w-12 text-green-400 drop-shadow-lg" />
                  </div>
                </div>
              </div>
              
              <h1 className="text-5xl font-bold text-white mb-6 tracking-tight">
                Portal de Leilões
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Acompanhe leilões ao vivo e acesse gravações de leilões anteriores. 
                Participe de lances em tempo real com total segurança e transparência.
              </p>
              
              {/* Stats mini cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-12">
                <div className="bg-gradient-to-br from-gray-900/80 to-black/60 backdrop-blur-sm border border-green-500/30 rounded-xl p-4 hover:border-green-500/50 transition-all duration-300">
                  <div className="flex items-center justify-center mb-2">
                    <Play className="h-6 w-6 text-green-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">{liveAuctions.length}</p>
                  <p className="text-green-400 text-sm">Ao Vivo</p>
                </div>
                
                <div className="bg-gradient-to-br from-gray-900/80 to-black/60 backdrop-blur-sm border border-blue-500/30 rounded-xl p-4 hover:border-blue-500/50 transition-all duration-300">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="h-6 w-6 text-blue-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">{auctions.length}</p>
                  <p className="text-blue-400 text-sm">Total</p>
                </div>
                
                <div className="bg-gradient-to-br from-gray-900/80 to-black/60 backdrop-blur-sm border border-amber-500/30 rounded-xl p-4 hover:border-amber-500/50 transition-all duration-300">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="h-6 w-6 text-amber-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">{auctions.filter(a => a.auction_type === 'rural').length}</p>
                  <p className="text-amber-400 text-sm">Rurais</p>
                </div>
                
                <div className="bg-gradient-to-br from-gray-900/80 to-black/60 backdrop-blur-sm border border-purple-500/30 rounded-xl p-4 hover:border-purple-500/50 transition-all duration-300">
                  <div className="flex items-center justify-center mb-2">
                    <Award className="h-6 w-6 text-purple-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">{auctions.filter(a => a.auction_type === 'judicial').length}</p>
                  <p className="text-purple-400 text-sm">Judiciais</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="live" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-900 border border-green-600/30">
            <TabsTrigger 
              value="live" 
              className="flex items-center gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-300"
            >
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              Leilões ao Vivo
              {liveAuctions.length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full ml-2">
                  {liveAuctions.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="recorded" 
              className="flex items-center gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-300"
            >
              <Trophy size={16} />
              Transmissões Encerradas
              {recordedAuctions.length > 0 && (
                <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full ml-2">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {liveAuctions.map((auction) => (
                  <AuctionCard key={auction.id} auction={auction} />
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recordedAuctions.map((auction) => (
                  <AuctionCard key={auction.id} auction={auction} />
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
