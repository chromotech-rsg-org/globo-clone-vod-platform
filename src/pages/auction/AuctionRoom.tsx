import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuctionDetails } from '@/hooks/useAuctions';
import { useAuctionRegistration } from '@/hooks/useAuctionRegistration';
import { useAuctionBids } from '@/hooks/useAuctionBids';
import { useAuctionItems } from '@/hooks/useAuctionItems';
import { useAuth } from '@/contexts/AuthContext';
import { BidUserState } from '@/types/auction';
import { Play, Square, User, AlertCircle, CheckCircle, Clock, ArrowLeft, Trophy, Package } from 'lucide-react';
import BidConfirmationDialog from '@/components/auction/BidConfirmationDialog';
import BidHistory from '@/components/auction/BidHistory';
import ClientNotifications from '@/components/auction/ClientNotifications';
import AuctionRoomHeader from '@/components/auction/AuctionRoomHeader';
import AuctionVideoPlayer from '@/components/auction/AuctionVideoPlayer';
import AuctionBidInfo from '@/components/auction/AuctionBidInfo';
import AuctionUserActions from '@/components/auction/AuctionUserActions';
import GuestModeBanner from '@/components/auction/GuestModeBanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

const AuctionRoom = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { auction, loading: auctionLoading } = useAuctionDetails(id!);
  const { registration, loading: registrationLoading, requestRegistration } = useAuctionRegistration(id!);
  const { bids, submitBid, submittingBid, pendingBidExists, userPendingBid, loading: bidsLoading } = useAuctionBids(id!);
  const { items: lots, loading: lotsLoading } = useAuctionItems(id!);
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

  const getUserStateInfo = () => {
    const hasWinner = bids.some(bid => bid.is_winner);
    const isAuctionFinished = hasWinner || auction?.status === 'inactive';
    
    switch (userState) {
      case 'need_registration':
        if (isAuctionFinished) {
          return {
            title: hasWinner ? 'Leilão Finalizado' : 'Leilão Encerrado',
            description: hasWinner 
              ? 'Este leilão já foi finalizado e possui um vencedor.' 
              : 'Este leilão foi encerrado.',
            action: null,
            variant: 'default' as const,
            icon: CheckCircle,
            onClick: null,
            disabled: true
          };
        }
        
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
        
        if (isAuctionFinished) {
          return {
            title: hasWinner ? 'Leilão Finalizado' : 'Leilão Encerrado',
            description: hasWinner 
              ? 'Este leilão já foi finalizado e possui um vencedor.' 
              : 'Este leilão foi encerrado.',
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Carregando leilão...</p>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Leilão não encontrado</h2>
          <p className="text-gray-300">O leilão que você está procurando não existe.</p>
        </div>
      </div>
    );
  }

  const stateInfo = getUserStateInfo();

  return (
    <div className="min-h-screen bg-black">
      <AuctionRoomHeader />
      
      {/* Guest Mode Banner - show only if user is not logged in */}
      {!user && <GuestModeBanner className="container mx-auto px-4 mb-4" />}
      
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2 space-y-6">
            <AuctionVideoPlayer auction={auction} />
            
            {/* Lista de Lotes */}
            <Card className="bg-gray-900 border-green-600/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Package className="h-5 w-5 text-green-400" />
                  Lotes do Leilão ({lots.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lotsLoading ? (
                  <div className="text-center py-4 text-gray-400">
                    Carregando lotes...
                  </div>
                ) : lots.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    Nenhum lote cadastrado para este leilão.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lots.map((lot, index) => (
                      <div 
                        key={lot.id} 
                        className={`bg-gray-800 border rounded-lg p-4 ${
                          lot.is_current 
                            ? 'border-green-500 bg-green-900/20' 
                            : 'border-gray-600'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-gray-400">
                                Lote {index + 1}
                              </span>
                              {lot.is_current && (
                                <Badge className="bg-green-600 text-white">
                                  Em Andamento
                                </Badge>
                              )}
                              <Badge 
                                className={
                                  lot.status === 'finished' 
                                    ? 'bg-gray-700 text-gray-300' 
                                    : lot.status === 'in_progress'
                                    ? 'bg-green-900/40 text-green-400 border-green-600'
                                    : 'bg-gray-800 text-gray-300 border-gray-600'
                                }
                              >
                                {lot.status === 'not_started' && 'Não Iniciado'}
                                {lot.status === 'in_progress' && 'Em Andamento'}
                                {lot.status === 'finished' && 'Finalizado'}
                              </Badge>
                            </div>
                            <h4 className="font-semibold text-white mb-1">{lot.name}</h4>
                            {lot.description && (
                              <p className="text-sm text-gray-300 mb-2">{lot.description}</p>
                            )}
                            <div className="text-sm space-y-1 text-gray-300">
                              <p>
                                Valor inicial: <span className="text-green-400 font-medium">
                                  R$ {lot.initial_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </p>
                              <p>
                                Valor atual: <span className="text-green-400 font-medium">
                                  R$ {lot.current_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </p>
                              {lot.increment && (
                                <p>
                                  Incremento: <span className="text-green-400 font-medium">
                                    R$ {lot.increment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bidding Panel */}
          <div className="space-y-6">
            {/* Current Bid Info */}
            <AuctionBidInfo 
              auction={auction}
              bids={bids}
              nextBidValue={nextBidValue}
            />

            {/* User Action Panel */}
            {stateInfo && (
              <AuctionUserActions
                auction={auction}
                bids={bids}
                userState={userState}
                stateInfo={stateInfo}
                submittingBid={submittingBid}
                userPendingBid={userPendingBid}
                userId={user?.id}
                onBidClick={() => setShowBidDialog(true)}
                onRequestRegistration={requestRegistration}
              />
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

      {/* Client Notifications - Fixed position */}
      <div className="fixed top-20 right-4 z-40">
        <ClientNotifications auctionId={id} />
      </div>
    </div>
  );
};

export default AuctionRoom;
