
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Gavel, Clock, TrendingUp, Users, Award, Home, User, LogOut } from 'lucide-react';
import { useAuctions } from '@/hooks/useAuctions';
import { useAuth } from '@/contexts/AuthContext';

const AuctionPromoBanner = () => {
  const { auctions, loading } = useAuctions();
  const { user, logout } = useAuth();
  const location = useLocation();
  
  const isHomePage = location.pathname === '/';
  
  const liveAuctions = auctions.filter(auction => auction.is_live);
  const totalAuctions = auctions.length;
  const ruralAuctions = auctions.filter(auction => auction.auction_type === 'rural').length;
  const judicialAuctions = auctions.filter(auction => auction.auction_type === 'judicial').length;

  if (loading) {
    return (
      <div className="w-full bg-gradient-to-br from-black via-gray-900 to-black border border-primary/20 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-2xl">
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
      
      <CardContent className="relative z-10 p-6">
        {/* Navigation Menu - only show when not on home page */}
        {!isHomePage && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-6">
              <Button asChild variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-800">
                <Link to="/" className="flex items-center space-x-2">
                  <Home className="h-4 w-4" />
                  <span>Início</span>
                </Link>
              </Button>
              <Button asChild variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-800">
                <Link to="/dashboard" className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </Button>
              <Button asChild variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-800">
                <Link to="/profile" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Perfil</span>
                </Link>
              </Button>
            </div>
            
            <div className="flex items-center space-x-4">
              {user && (
                <span className="text-gray-300">Olá, {user.name || user.email}</span>
              )}
              <Button 
                onClick={logout}
                variant="ghost" 
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        )}

        {/* Header Section - more compact */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0 mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
              <div className="relative p-3 bg-gradient-to-br from-primary/20 to-primary/30 rounded-2xl border border-primary/40">
                <Gavel className="h-8 w-8 text-primary drop-shadow-lg" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                Portal de Leilões
              </h1>
              <p className="text-gray-300 text-base leading-relaxed max-w-md">
                Participe de leilões em tempo real com total transparência e segurança
              </p>
            </div>
          </div>
          
          {isHomePage && (
            <Button 
              asChild 
              size="lg" 
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-primary/20"
            >
              <Link to="/auctions" className="flex items-center space-x-2">
                <span>Ver Todos os Leilões</span>
                <TrendingUp className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>

        {/* Stats Grid - more compact */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Live Auctions */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl blur-sm group-hover:blur-none transition-all duration-300"></div>
            <div className="relative bg-gradient-to-br from-gray-900/80 to-black/60 backdrop-blur-sm border border-green-500/30 rounded-xl p-4 hover:border-green-500/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Clock className="h-5 w-5 text-green-400" />
                </div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-white">{liveAuctions.length}</p>
                <p className="text-green-400 font-medium text-sm">Ao Vivo</p>
              </div>
            </div>
          </div>

          {/* Total Auctions */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl blur-sm group-hover:blur-none transition-all duration-300"></div>
            <div className="relative bg-gradient-to-br from-gray-900/80 to-black/60 backdrop-blur-sm border border-blue-500/30 rounded-xl p-4 hover:border-blue-500/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-white">{totalAuctions}</p>
                <p className="text-blue-400 font-medium text-sm">Total</p>
              </div>
            </div>
          </div>

          {/* Rural Auctions */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-xl blur-sm group-hover:blur-none transition-all duration-300"></div>
            <div className="relative bg-gradient-to-br from-gray-900/80 to-black/60 backdrop-blur-sm border border-amber-500/30 rounded-xl p-4 hover:border-amber-500/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Users className="h-5 w-5 text-amber-400" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-white">{ruralAuctions}</p>
                <p className="text-amber-400 font-medium text-sm">Rurais</p>
              </div>
            </div>
          </div>

          {/* Judicial Auctions */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl blur-sm group-hover:blur-none transition-all duration-300"></div>
            <div className="relative bg-gradient-to-br from-gray-900/80 to-black/60 backdrop-blur-sm border border-purple-500/30 rounded-xl p-4 hover:border-purple-500/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Award className="h-5 w-5 text-purple-400" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-white">{judicialAuctions}</p>
                <p className="text-purple-400 font-medium text-sm">Judiciais</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuctionPromoBanner;
