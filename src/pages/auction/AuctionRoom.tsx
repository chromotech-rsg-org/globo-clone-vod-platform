import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuctionDetails } from '@/hooks/useAuctions';
import { useAuctionRegistration } from '@/hooks/useAuctionRegistration';
import { useAuctionBids } from '@/hooks/useAuctionBids';
import { useAuctionItems } from '@/hooks/useAuctionItems';
import { useCustomIncrement } from '@/hooks/useCustomIncrement';
import { useLotStatistics } from '@/hooks/useLotStatistics';
import { useAuth } from '@/contexts/AuthContext';
import { BidUserState } from '@/types/auction';
import { User, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import BidConfirmationDialog from '@/components/auction/BidConfirmationDialog';
import ClientNotifications from '@/components/auction/ClientNotifications';
import AuctionRoomHeader from '@/components/auction/AuctionRoomHeader';
import AuctionVideoPlayer from '@/components/auction/AuctionVideoPlayer';
import AuctionUserActions from '@/components/auction/AuctionUserActions';
import GuestModeBanner from '@/components/auction/GuestModeBanner';
import AuctionHeader from '@/components/auction/AuctionHeader';
import CurrentLotDisplay from '@/components/auction/CurrentLotDisplay';
import AuctionStatusSummary from '@/components/auction/AuctionStatusSummary';
import LotsList from '@/components/auction/LotsList';
import BidHistoryWithFilters from '@/components/auction/BidHistoryWithFilters';
import { useToast } from '@/components/ui/use-toast';

const AuctionRoom = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { auction, loading: auctionLoading } = useAuctionDetails(id!);
  const { registration, loading: registrationLoading, requestRegistration } = useAuctionRegistration(id!);
  const { bids, submitBid, submittingBid, pendingBidExists, userPendingBid, loading: bidsLoading } = useAuctionBids(id!);
  const { items: lots, loading: lotsLoading } = useAuctionItems(id!);
  const { 
    currentLot, 
    currentLotId, 
    hasActiveLot, 
    isAllFinished 
  } = useLotStatistics(lots, bids);
  const { customIncrement, updateCustomIncrement } = useCustomIncrement(currentLot, auction);
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
    if (!auction || !customIncrement) return;

    // Valor base do lance: valor atual do lote (ou do leilão se não houver lote),
    // considerando o maior lance aprovado do lote atual
    let base = Number(currentLot ? currentLot.current_value : auction.current_bid_value);

    const approvedBids = bids.filter(bid => bid.status === 'approved' && (!currentLot || bid.auction_item_id === currentLot.id));
    if (approvedBids.length > 0) {
      const highestBid = Math.max(...approvedBids.map(b => Number(b.bid_value)));
      if (highestBid > base) {
        base = highestBid;
      }
    }

    setNextBidValue(base + customIncrement);
  }, [auction, currentLot, bids, customIncrement]);

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

  const canBid = userState === 'can_bid' && !submittingBid && !isAllFinished;

  return (
    <div className="min-h-screen bg-black">
      <AuctionRoomHeader />
      
      {/* Guest Mode Banner - show only if user is not logged in */}
      {!user && <GuestModeBanner className="container mx-auto px-4 mb-4" />}
      
      <div className="p-6 space-y-6">
        {/* Header do Leilão */}
        <AuctionHeader auction={auction} lots={lots} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Coluna Principal - Video e Lote Atual/Status */}
          <div className="xl:col-span-2 space-y-6">
            {/* Video e Lote Atual lado a lado */}
            {hasActiveLot && currentLot ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Video Player */}
                <AuctionVideoPlayer auction={auction} />
                
                {/* Lote Atual */}
                <CurrentLotDisplay
                  currentLot={currentLot}
                  auction={auction}
                  bids={bids}
                  customIncrement={customIncrement}
                  onIncrementChange={updateCustomIncrement}
                  nextBidValue={nextBidValue}
                  onBidClick={() => setShowBidDialog(true)}
                  canBid={canBid}
                />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Video Player */}
                <AuctionVideoPlayer auction={auction} />
                
                {/* Status Summary quando não há lote ativo */}
                <AuctionStatusSummary
                  lots={lots}
                  bids={bids}
                  currentUserId={user?.id}
                />
              </div>
            )}

          </div>

          {/* Coluna Lateral - Ações do Usuário e Histórico */}
          <div className="space-y-6">
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

            {/* Histórico de Lances com Filtros */}
            <BidHistoryWithFilters
              bids={bids}
              lots={lots}
              loading={bidsLoading}
              currentUserId={user?.id}
            />
          </div>
        </div>
        </div>

        {/* Lista de Todos os Lotes - Largura Total */}
        {!lotsLoading && (
          <div className="mt-8">
            <LotsList
              lots={lots}
              bids={bids}
              currentUserId={user?.id}
              currentLotId={currentLotId}
            />
          </div>
        )}

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
