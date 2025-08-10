import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, Gavel, BarChart3 } from 'lucide-react';

interface AuctionBannerProps {
  auctionId?: string;
  auctionName?: string;
}

const AuctionBanner = ({ auctionId, auctionName }: AuctionBannerProps) => {
  return (
    <Card className="mb-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-foreground">Navegação Rápida</h3>
            <p className="text-sm text-muted-foreground">
              Acesse rapidamente as principais seções do sistema
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                Home
              </Button>
            </Link>
            
            {auctionId && (
              <>
                <Link to={`/auctions/${auctionId}`}>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Gavel className="w-4 h-4" />
                    {auctionName ? `${auctionName.slice(0, 20)}...` : 'Ver Leilão'}
                  </Button>
                </Link>
                
                <Link to={`/auction-dashboard/${auctionId}`}>
                  <Button size="sm" className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuctionBanner;