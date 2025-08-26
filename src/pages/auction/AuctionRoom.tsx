
import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Gavel, Users, Clock, DollarSign } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useEnhancedAuctionRegistration } from '@/hooks/useEnhancedAuctionRegistration';
import { useEnhancedAuctionBids } from '@/hooks/useEnhancedAuctionBids';
import { useAuctions } from '@/hooks/useAuctions';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import BidHistory from '@/components/auction/BidHistory';

const AuctionRoom = () => {
  const { auctionId } = useParams<{ auctionId: string }>();
  const { user } = useAuth();
  const [bidValue, setBidValue] = useState<number>(0);

  // Redirect if no auction ID
  if (!auctionId) {
    return <Navigate to="/auction" replace />;
  }

  const { auctions, loading: auctionsLoading } = useAuctions();
  const { registration, loading: registrationLoading, requestRegistration } = useEnhancedAuctionRegistration(auctionId);
  const { bids, loading: bidsLoading, submitBid, submittingBid, pendingBidExists } = useEnhancedAuctionBids(auctionId);

  const auction = auctions?.find(a => a.id === auctionId);

  useEffect(() => {
    if (auction) {
      setBidValue(auction.current_bid_value + auction.bid_increment);
    }
  }, [auction]);

  if (auctionsLoading || registrationLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Leilão não encontrado ou não está mais ativo.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const canBid = registration?.status === 'approved' && !pendingBidExists;
  const needsRegistration = !registration;
  const registrationPending = registration?.status === 'pending';
  const registrationRejected = registration?.status === 'rejected';

  const handleSubmitBid = async () => {
    if (canBid && bidValue > auction.current_bid_value) {
      const success = await submitBid(bidValue);
      if (success) {
        setBidValue(auction.current_bid_value + auction.bid_increment);
      }
    }
  };

  const getRegistrationStatus = () => {
    if (needsRegistration) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você precisa se habilitar para participar deste leilão.
            <Button 
              onClick={requestRegistration} 
              className="ml-2" 
              size="sm"
            >
              Solicitar Habilitação
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    if (registrationPending) {
      return (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Sua solicitação de habilitação está em análise. Aguarde a aprovação.
          </AlertDescription>
        </Alert>
      );
    }

    if (registrationRejected) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Sua habilitação foi rejeitada. 
            {registration.client_notes && (
              <div className="mt-2 text-sm">
                <strong>Motivo:</strong> {registration.client_notes}
              </div>
            )}
            <Button 
              onClick={requestRegistration} 
              className="ml-2 mt-2" 
              size="sm"
              variant="outline"
            >
              Solicitar Novamente
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    if (pendingBidExists) {
      return (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Você possui um lance em análise. Aguarde a aprovação antes de fazer um novo lance.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert className="border-green-200 bg-green-50">
        <Users className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Você está habilitado para participar deste leilão!
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Auction Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gavel className="h-5 w-5" />
                {auction.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auction.description && (
                  <p className="text-muted-foreground">{auction.description}</p>
                )}
                
                {auction.youtube_url && (
                  <div className="aspect-video">
                    <iframe
                      src={auction.youtube_url.replace('watch?v=', 'embed/')}
                      className="w-full h-full rounded-lg"
                      allowFullScreen
                      title="Transmissão do Leilão"
                    ></iframe>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(auction.current_bid_value)}
                    </div>
                    <div className="text-sm text-muted-foreground">Lance Atual</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {formatCurrency(auction.bid_increment)}
                    </div>
                    <div className="text-sm text-muted-foreground">Incremento</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {bids.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Total de Lances</div>
                  </div>
                  <div className="text-center">
                    <Badge variant={auction.is_live ? "default" : "secondary"}>
                      {auction.is_live ? "AO VIVO" : "OFFLINE"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Registration Status */}
          {getRegistrationStatus()}

          {/* Bidding Section */}
          {canBid && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Fazer Lance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Input
                    type="number"
                    value={bidValue}
                    onChange={(e) => setBidValue(Number(e.target.value))}
                    min={auction.current_bid_value + auction.bid_increment}
                    step={auction.bid_increment}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSubmitBid}
                    disabled={submittingBid || bidValue <= auction.current_bid_value}
                    className="px-8"
                  >
                    {submittingBid ? 'Enviando...' : 'Enviar Lance'}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Lance mínimo: {formatCurrency(auction.current_bid_value + auction.bid_increment)}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Bid History */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Lances</CardTitle>
            </CardHeader>
            <CardContent>
              <BidHistory 
                bids={bids} 
                loading={bidsLoading}
                currentUserId={user?.id}
              />
            </CardContent>
          </Card>

          {/* Auction Details */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Leilão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm font-medium">Tipo</div>
                <div className="text-sm text-muted-foreground">
                  {auction.auction_type === 'rural' ? 'Rural' : 'Judicial'}
                </div>
              </div>
              {auction.start_date && (
                <div>
                  <div className="text-sm font-medium">Início</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDateTime(auction.start_date)}
                  </div>
                </div>
              )}
              {auction.end_date && (
                <div>
                  <div className="text-sm font-medium">Término</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDateTime(auction.end_date)}
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm font-medium">Criado em</div>
                <div className="text-sm text-muted-foreground">
                  {formatDateTime(auction.created_at)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuctionRoom;
