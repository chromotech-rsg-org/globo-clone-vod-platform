
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Gavel, Clock, TrendingUp, Users, Calendar, Award } from 'lucide-react';
import { useAuctions } from '@/hooks/useAuctions';

const AuctionPromoBanner = () => {
  const { auctions, loading } = useAuctions();
  
  const liveAuctions = auctions.filter(auction => auction.is_live);
  const totalAuctions = auctions.length;
  const ruralAuctions = auctions.filter(auction => auction.auction_type === 'rural').length;
  const judicialAuctions = auctions.filter(auction => auction.auction_type === 'judicial').length;

  if (loading) {
    return (
      <div className="w-full bg-gradient-to-br from-black via-gray-900 to-black border border-primary/20 backdrop-blur-sm rounded-2xl p-8 mb-8 shadow-2xl">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full bg-gradient-to-br from-black via-gray-900 to-black border-2 border-primary/30 mb-8 shadow-2xl overflow-hidden relative">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(22,163,74,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(22,163,74,0.05)_50%,transparent_75%)]"></div>
      
      <CardContent className="relative z-10 p-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-6 lg:space-y-0 mb-8">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
              <div className="relative p-4 bg-gradient-to-br from-primary/20 to-primary/30 rounded-2xl border border-primary/40">
                <Gavel className="h-10 w-10 text-primary drop-shadow-lg" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
                Leilões Online
              </h1>
              <p className="text-gray-300 text-lg leading-relaxed max-w-md">
                Participe de leilões rurais e judiciais em tempo real com total transparência e segurança
              </p>
            </div>
          </div>
          
          <Button 
            asChild 
            size="lg" 
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-primary/20"
          >
            <Link to="/auctions" className="flex items-center space-x-2">
              <span>Ver Todos os Leilões</span>
              <TrendingUp className="h-5 w-5" />
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Live Auctions */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl blur-sm group-hover:blur-none transition-all duration-300"></div>
            <div className="relative bg-gradient-to-br from-gray-900/80 to-black/60 backdrop-blur-sm border border-green-500/30 rounded-xl p-6 hover:border-green-500/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <Clock className="h-6 w-6 text-green-400" />
                </div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-white">{liveAuctions.length}</p>
                <p className="text-green-400 font-medium">Ao Vivo</p>
                <p className="text-xs text-gray-400">Acontecendo agora</p>
              </div>
            </div>
          </div>

          {/* Total Auctions */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl blur-sm group-hover:blur-none transition-all duration-300"></div>
            <div className="relative bg-gradient-to-br from-gray-900/80 to-black/60 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-400" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-white">{totalAuctions}</p>
                <p className="text-blue-400 font-medium">Total</p>
                <p className="text-xs text-gray-400">Leilões disponíveis</p>
              </div>
            </div>
          </div>

          {/* Rural Auctions */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-xl blur-sm group-hover:blur-none transition-all duration-300"></div>
            <div className="relative bg-gradient-to-br from-gray-900/80 to-black/60 backdrop-blur-sm border border-amber-500/30 rounded-xl p-6 hover:border-amber-500/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-500/20 rounded-lg">
                  <Users className="h-6 w-6 text-amber-400" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-white">{ruralAuctions}</p>
                <p className="text-amber-400 font-medium">Rurais</p>
                <p className="text-xs text-gray-400">Equipamentos e terras</p>
              </div>
            </div>
          </div>

          {/* Judicial Auctions */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl blur-sm group-hover:blur-none transition-all duration-300"></div>
            <div className="relative bg-gradient-to-br from-gray-900/80 to-black/60 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Award className="h-6 w-6 text-purple-400" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-white">{judicialAuctions}</p>
                <p className="text-purple-400 font-medium">Judiciais</p>
                <p className="text-xs text-gray-400">Determinações legais</p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <h3 className="text-xl font-semibold text-white">Não perca nenhuma oportunidade</h3>
                <p className="text-gray-300">Cadastre-se e receba notificações sobre novos leilões</p>
              </div>
            </div>
            <Button 
              asChild 
              variant="outline" 
              className="border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/60 transition-all duration-300"
            >
              <Link to="/register">
                Cadastrar-se
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuctionPromoBanner;
