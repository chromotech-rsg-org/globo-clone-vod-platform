import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Gavel, Clock, TrendingUp } from 'lucide-react';
import { useAuctions } from '@/hooks/useAuctions';

const AuctionPromoBanner = () => {
  const { auctions, loading } = useAuctions();
  
  const liveAuctions = auctions.filter(auction => auction.is_live);
  const totalAuctions = auctions.length;

  if (loading) {
    return (
      <div className="w-full bg-gradient-to-r from-primary/20 to-secondary/20 backdrop-blur-sm rounded-lg p-6 mb-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 mb-8">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary/20 rounded-full">
              <Gavel className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Leilões Online
              </h2>
              <p className="text-muted-foreground">
                Participe de leilões rurais e judiciais em tempo real
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="flex items-center space-x-1 text-green-500">
                <Clock className="h-4 w-4" />
                <span className="font-semibold">{liveAuctions.length}</span>
              </div>
              <p className="text-xs text-muted-foreground">Ao Vivo</p>
            </div>
            <div className="text-center">
              <div className="flex items-center space-x-1 text-blue-500">
                <TrendingUp className="h-4 w-4" />
                <span className="font-semibold">{totalAuctions}</span>
              </div>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <Button asChild size="lg">
              <Link to="/auctions">
                Ver Leilões
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuctionPromoBanner;