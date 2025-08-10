import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuctionDetails } from '@/hooks/useAuctions';
import { useAuctionRegistration } from '@/hooks/useAuctionRegistration';
import { useAuctionBids } from '@/hooks/useAuctionBids';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency } from '@/utils/formatters';
import { BidUserState } from '@/types/auction';
import { Play, Square, User, AlertCircle, CheckCircle, Clock, ArrowLeft, Trophy } from 'lucide-react';
import BidConfirmationDialog from '@/components/auction/BidConfirmationDialog';
import BidHistory from '@/components/auction/BidHistory';
import { useToast } from '@/components/ui/use-toast';

const AuctionRoom = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { auction, loading: auctionLoading } = useAuctionDetails(id!);
  const { registration, loading: registrationLoading, requestRegistration } = useAuctionRegistration(id!);
  const { bids, submitBid, submittingBid, pendingBidExists, userPendingBid, loading: bidsLoading } = useAuctionBids(id!);
  const [userState, setUserState] = useState<BidUserState>('need_registration');
  const [showBidDialog, setShowBidDialog] = useState(false);
  const [nextBidValue, setNextBidValue] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (!registration) {
      setUserState('need_registration');
    } else {
      switch (registration.status) {
        case 'pending':
          setUserState('registration_pending');
          break;
        case 'rejected':
          setUserState('registration_rejected');
          break;
        case 'approved':
          if (userPendingBid) {
            setUserState('bid_pending');
          } else {
            setUserState('can_bid');
          }
          break;
      }
    }
  }, [registration, userPendingBid]);

  useEffect(() => {
    if (auction) {
      setNextBidValue(auction.current_bid_value + auction.bid_increment);
    }
  }, [auction]);

  // Update next bid value when current bid changes via real-time
  useEffect(() => {
    if (auction && bids.length > 0) {
      const approvedBids = bids.filter(bid => bid.status === 'approved');
      if (approvedBids.length > 0) {
        const highestBid = Math.max(...approvedBids.map(bid => bid.bid_value));
        if (highestBid > auction.current_bid_value) {
          setNextBidValue(highestBid + auction.bid_increment);
        }
      }
    }
  }, [bids, auction]);

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return '';
    
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (videoIdMatch) {
      return `https://www.youtube.com/embed/${videoIdMatch[1]}?autoplay=1&modestbranding=1`;
    }
    return url;
  };

  const getUserStateInfo = () => {
    switch (userState) {
      case 'need_registration':
        return {
          title: 'Habilitação Necessária',
          description: 'Você precisa se habilitar para participar deste leilão.',
          action: 'Solicitar Habilitação',
          variant: 'default' as const,
          icon: User,
          onClick: requestRegistration,
          disabled: false
        };
      case 'registration_pending':
        return {
          title: 'Aguarde Habilitação',
          description: 'Recebemos sua solicitação. Aguarde a aprovação.',
          action: null,
          variant: 'default' as const,
          icon: Clock,
          onClick: null,
          disabled: false
        };
      case 'registration_rejected':
        return {
          title: 'Habilitação Rejeitada',
          description: registration?.client_notes || 'Sua habilitação foi rejeitada.',
          action: 'Solicitar Novamente',
          variant: 'destructive' as const,
          icon: AlertCircle,
          onClick: requestRegistration,
          disabled: false
        };
      case 'can_bid':
        const anyPendingBid = bids.some(bid => bid.status === 'pending');
        const hasWinner = bids.some(bid => bid.is_winner);
        const isAuctionFinished = hasWinner;
        
        if (isAuctionFinished) {
          return {
            title: 'Leilão Finalizado',
            description: 'Este leilão já foi finalizado e possui um vencedor.',
            action: null,
            variant: 'default' as const,
            icon: CheckCircle,
            onClick: null,
            disabled: true
          };
        }
        
        return {
          title: 'Habilitado para Lançar',
          description: anyPendingBid && !userPendingBid 
            ? 'Há um lance em análise. Aguarde para fazer seu lance.' 
            : 'Você está habilitado a participar do leilão.',
          action: anyPendingBid && !userPendingBid ? 'Aguarde lance em análise' : 'Fazer Lance',
          variant: 'default' as const,
          icon: CheckCircle,
          onClick: anyPendingBid && !userPendingBid ? null : () => setShowBidDialog(true),
          disabled: anyPendingBid && !userPendingBid
        };
      case 'bid_pending':
        return {
          title: 'Lance em Análise',
          description: 'Seu lance está sendo analisado. Aguarde a resposta.',
          action: 'Aguarde, lance em análise',
          variant: 'default' as const,
          icon: Clock,
          onClick: null,
          disabled: true
        };
      default:
        return null;
    }
  };

  if (auctionLoading || registrationLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando leilão...</p>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Leilão não encontrado</h2>
          <p className="text-muted-foreground">O leilão que você está procurando não existe.</p>
        </div>
      </div>
    );
  }

  const stateInfo = getUserStateInfo();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Botão Voltar */}
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/auctions')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Voltar ao Painel
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video bg-black rounded-t-lg overflow-hidden">
                  {auction.youtube_url ? (
                    <iframe
                      src={getYouTubeEmbedUrl(auction.youtube_url)}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white">
                      <div className="text-center">
                        <Play size={64} className="mx-auto mb-4 opacity-50" />
                        <p>Transmissão não disponível</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="text-2xl font-bold text-foreground mb-2">
                        {auction.name}
                      </h1>
                      {auction.description && (
                        <p className="text-muted-foreground">
                          {auction.description}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge 
                        variant={auction.is_live ? "default" : "secondary"}
                        className="flex items-center gap-1"
                      >
                        {auction.is_live ? <Play size={12} /> : <Square size={12} />}
                        {auction.is_live ? 'AO VIVO' : 'GRAVADO'}
                      </Badge>
                      <Badge variant="outline">
                        {auction.auction_type === 'rural' ? 'Rural' : 'Judicial'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bidding Panel */}
          <div className="space-y-6">
            {/* Current Bid Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações do Lance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wide">
                    Lance Atual
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {(() => {
                      const approvedBids = bids.filter(bid => bid.status === 'approved');
                      if (approvedBids.length > 0) {
                        const highestBid = Math.max(...approvedBids.map(bid => bid.bid_value));
                        return formatCurrency(Math.max(highestBid, auction.current_bid_value));
                      }
                      return formatCurrency(auction.current_bid_value);
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wide">
                    Lance Inicial
                  </p>
                  <p className="text-lg font-medium text-muted-foreground">
                    {formatCurrency(auction.initial_bid_value)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wide">
                    {(() => {
                      const hasWinner = bids.some(bid => bid.is_winner);
                      return hasWinner ? 'Valor Arrematado' : 'Próximo Lance';
                    })()}
                  </p>
                  <p className="text-xl font-semibold text-foreground">
                    {(() => {
                      const hasWinner = bids.some(bid => bid.is_winner);
                      if (hasWinner) {
                        const winningBid = bids.find(bid => bid.is_winner);
                        return formatCurrency(winningBid?.bid_value || auction.current_bid_value);
                      }
                      return formatCurrency(nextBidValue);
                    })()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* User Action Panel */}
            {stateInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <stateInfo.icon size={20} />
                    {stateInfo.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert variant={stateInfo.variant === 'destructive' ? 'destructive' : 'default'}>
                    <AlertDescription>
                      {stateInfo.description}
                    </AlertDescription>
                  </Alert>
                   
                    {stateInfo.action && (
                      <Button 
                        onClick={stateInfo.onClick}
                        className="w-full"
                        variant={stateInfo.variant === 'destructive' ? 'outline' : 'default'}
                        disabled={stateInfo.disabled || submittingBid || !stateInfo.onClick}
                      >
                        {submittingBid ? 'Enviando lance...' : stateInfo.action}
                      </Button>
                    )}

                    {/* Status do lance do usuário */}
                    {userPendingBid && (
                      <Alert className="mt-4">
                        <Clock className="h-4 w-4" />
                        <AlertDescription>
                          <div className="flex justify-between items-center">
                            <span>Seu lance: {formatCurrency(userPendingBid.bid_value)}</span>
                            <Badge variant="secondary">Em análise</Badge>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Mostrar se o usuário tem lance vencedor */}
                    {(() => {
                      const userWinningBid = bids.find(bid => 
                        bid.user_id === user?.id && bid.is_winner && bid.status === 'approved'
                      );
                      if (userWinningBid) {
                        return (
                          <Alert className="mt-4 border-green-500 bg-green-50">
                            <Trophy className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                              <div className="text-center">
                                <p className="font-bold">🎉 Parabéns! Você é o vencedor!</p>
                                <p>Lance vencedor: {formatCurrency(userWinningBid.bid_value)}</p>
                              </div>
                            </AlertDescription>
                          </Alert>
                        );
                      }
                      
                      // Verificar se há algum vencedor no leilão
                      const anyWinner = bids.find(bid => bid.is_winner);
                      if (anyWinner && anyWinner.user_id !== user?.id) {
                        return (
                          <Alert className="mt-4 border-orange-500 bg-orange-50">
                            <Trophy className="h-4 w-4 text-orange-600" />
                            <AlertDescription className="text-orange-800">
                              <div className="text-center">
                                <p className="font-bold">Leilão Finalizado</p>
                                <p>Lance vencedor: {formatCurrency(anyWinner.bid_value)}</p>
                                <p className="text-sm">Vencedor: {anyWinner.user_name || 'Usuário'}</p>
                              </div>
                            </AlertDescription>
                          </Alert>
                        );
                      }
                    })()}
                </CardContent>
              </Card>
             )}

              {/* Histórico de Lances */}
              <BidHistory 
                bids={bids} 
                loading={bidsLoading} 
                currentUserId={user?.id} 
              />
           </div>
         </div>
       </div>

      {/* Bid Confirmation Dialog */}
       <BidConfirmationDialog
         open={showBidDialog}
         onOpenChange={setShowBidDialog}
         auction={auction}
         bidValue={nextBidValue}
         onConfirm={async () => {
           const success = await submitBid(nextBidValue);
           if (success) {
             setShowBidDialog(false);
           }
         }}
       />
    </div>
  );
};

export default AuctionRoom;