import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuctions } from '@/hooks/useAuctions';
import AuctionCard from '@/components/auction/AuctionCard';
import { Gavel, Trophy } from 'lucide-react';

const AuctionHome = () => {
  const { auctions, loading } = useAuctions();

  const liveAuctions = auctions.filter(auction => auction.is_live);
  const recordedAuctions = auctions.filter(auction => !auction.is_live);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-card rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4 flex items-center justify-center gap-3">
              <Gavel className="text-primary" size={40} />
              Portal de Leilões
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Acompanhe leilões ao vivo e acesse gravações de leilões anteriores. 
              Participe de lances em tempo real com total segurança.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="live" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="live" className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              Leilões ao Vivo
              {liveAuctions.length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full ml-2">
                  {liveAuctions.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="recorded" className="flex items-center gap-2">
              <Trophy size={16} />
              Transmissões Encerradas
              {recordedAuctions.length > 0 && (
                <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full ml-2">
                  {recordedAuctions.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="space-y-6">
            {liveAuctions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gavel size={32} className="text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Nenhum leilão ao vivo
                </h3>
                <p className="text-muted-foreground">
                  No momento não há leilões sendo transmitidos ao vivo.
                </p>
              </div>
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
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy size={32} className="text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Nenhuma transmissão disponível
                </h3>
                <p className="text-muted-foreground">
                  Ainda não há gravações de leilões disponíveis.
                </p>
              </div>
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