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
import { DuplicateBidModal } from '@/components/auction/DuplicateBidModal';
import { OutbidNotificationModal } from '@/components/auction/OutbidNotificationModal';
import { BidLimitReachedDialog } from '@/components/auction/BidLimitReachedDialog';
import ClientNotifications from '@/components/auction/ClientNotifications';
import AuctionRoomHeader from '@/components/auction/AuctionRoomHeader';
import AuctionVideoPlayer from '@/components/auction/AuctionVideoPlayer';
import AuctionUserActions from '@/components/auction/AuctionUserActions';
import GuestModeBanner from '@/components/auction/GuestModeBanner';
import AuctionHeader from '@/components/auction/AuctionHeader';
import CurrentLotDisplay from '@/components/auction/CurrentLotDisplay';
import PreBiddingLotDisplay from '@/components/auction/PreBiddingLotDisplay';
import AuctionStatusSummary from '@/components/auction/AuctionStatusSummary';
import LotsList from '@/components/auction/LotsList';
import BidHistoryWithFilters from '@/components/auction/BidHistoryWithFilters';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/utils/formatters';
import { useBidLimitValidation } from '@/hooks/useBidLimitValidation';

const AuctionRoom = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { auction, loading: auctionLoading, refetch: refetchAuction } = useAuctionDetails(id!);
  const { registration, loading: registrationLoading, requestRegistration } = useAuctionRegistration(id!);
  const { bids, submitBid, submittingBid, pendingBidExists, userPendingBid, loading: bidsLoading, refetch: refetchBids } = useAuctionBids(id!);
  const { items: lots, loading: lotsLoading, refetch: refetchLots } = useAuctionItems(id!);
  const { 
    currentLot, 
    currentLotId, 
    hasActiveLot,
    preBiddingLots,
    hasPreBiddingLots,
    multiplePreBiddingLots,
    isAllFinished 
  } = useLotStatistics(lots, bids);
const [selectedPreBiddingLotId, setSelectedPreBiddingLotId] = useState<string | undefined>();

  // Selecionar automaticamente o primeiro lote de pré-lance se não houver seleção
  useEffect(() => {
    if (hasPreBiddingLots && preBiddingLots.length > 0 && !selectedPreBiddingLotId) {
      setSelectedPreBiddingLotId(preBiddingLots[0].id);
    }
  }, [hasPreBiddingLots, preBiddingLots, selectedPreBiddingLotId]);
  const { customIncrement, updateCustomIncrement } = useCustomIncrement(
    currentLot, 
    auction, 
    selectedPreBiddingLotId ? preBiddingLots.find(lot => lot.id === selectedPreBiddingLotId) : null
  );
const [userState, setUserState] = useState<BidUserState>('need_registration');
const [showBidDialog, setShowBidDialog] = useState(false);
const [showDuplicateBidModal, setShowDuplicateBidModal] = useState(false);
const [showOutbidModal, setShowOutbidModal] = useState(false);
const [showLimitReachedDialog, setShowLimitReachedDialog] = useState(false);
const [limitReachedData, setLimitReachedData] = useState<{
  currentLimit: number;
  totalBidsUsed: number;
  attemptedBidValue: number;
  auctionItemId: string;
} | null>(null);
const [duplicateBidValue, setDuplicateBidValue] = useState(0);
const [originalBidValue, setOriginalBidValue] = useState(0);
const [nextBidValue, setNextBidValue] = useState(0);
const [currentBaseValue, setCurrentBaseValue] = useState(0);
const { toast } = useToast();
const { validateBidLimit, logFailedBidAttempt } = useBidLimitValidation();

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
        case 'disabled':
          setUserState('need_registration'); // Treat disabled as need_registration
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

  // Determinar qual lote usar para cálculos
  const targetLot = (hasPreBiddingLots && selectedPreBiddingLotId) 
    ? preBiddingLots.find(lot => lot.id === selectedPreBiddingLotId) || currentLot
    : currentLot;

  // Valor base do lance: valor atual do lote (ou do leilão se não houver lote),
  // considerando o maior lance aprovado do lote alvo
  let base = Number(targetLot ? targetLot.current_value : auction.current_bid_value);

  const approvedBids = bids.filter(bid => bid.status === 'approved' && (!targetLot || bid.auction_item_id === targetLot.id));
  if (approvedBids.length > 0) {
    const highestBid = Math.max(...approvedBids.map(b => Number(b.bid_value)));
    if (highestBid > base) {
      base = highestBid;
    }
  }

  const calculatedNextBid = base + customIncrement;
  setCurrentBaseValue(base);
  setNextBidValue(calculatedNextBid);
  
  // Debug logs para rastrear valores de incremento
  console.log('🔍 Calculating nextBidValue:', {
    base,
    customIncrement,
    calculatedNextBid,
    targetLot: targetLot ? { id: targetLot.id, name: targetLot.name, increment: targetLot.increment } : null,
    currentLot: currentLot ? { id: currentLot.id, name: currentLot.name, increment: currentLot.increment } : null,
    auctionIncrement: auction.bid_increment,
    isPreBiddingMode: hasPreBiddingLots,
    selectedPreBiddingLotId
  });
}, [auction, currentLot, bids, customIncrement, hasPreBiddingLots, selectedPreBiddingLotId, preBiddingLots]);

// Função para recalcular valor do lance com dados atuais
const recalculateNextBidValue = () => {
  if (!auction || !customIncrement) return 0;

  // Determinar qual lote usar para cálculos
  const targetLot = (hasPreBiddingLots && selectedPreBiddingLotId) 
    ? preBiddingLots.find(lot => lot.id === selectedPreBiddingLotId) || currentLot
    : currentLot;

  // Valor base do lance
  let base = Number(targetLot ? targetLot.current_value : auction.current_bid_value);

  // Filtrar lances aprovados
  const approvedBids = bids.filter(bid => 
    bid.status === 'approved' && 
    (!targetLot || bid.auction_item_id === targetLot.id)
  );

  // Se houver lances aprovados, usar o maior como base
  if (approvedBids.length > 0) {
    const highestBid = Math.max(...approvedBids.map(b => Number(b.bid_value)));
    if (highestBid > base) {
      base = highestBid;
    }
  }

  const calculatedNextBid = base + customIncrement;
  
  // Atualiza valor base atual para exibição no diálogo
  setCurrentBaseValue(base);
  
  console.log('🔄 Recalculando nextBidValue:', {
    base,
    customIncrement,
    calculatedNextBid,
    approvedBidsCount: approvedBids.length,
    highestApprovedBid: approvedBids.length > 0 ? Math.max(...approvedBids.map(b => Number(b.bid_value))) : 'N/A',
    targetLot: targetLot ? { id: targetLot.id, current_value: targetLot.current_value } : null,
    currentLot: currentLot ? { id: currentLot.id, current_value: currentLot.current_value } : null,
    auctionCurrentValue: auction.current_bid_value,
    isPreBiddingMode: hasPreBiddingLots,
    selectedPreBiddingLotId
  });

  return calculatedNextBid;
};

  // Função para abrir dialog de lance com dados atualizados
  const openBidDialogComAtualizacao = async (lotId?: string) => {
    // Se for pré-lance e há um lotId específico, usar esse lote
    if (lotId && hasPreBiddingLots) {
      setSelectedPreBiddingLotId(lotId);
    }
    try {
      console.log('🔄 Atualizando dados antes de abrir dialog de lance...');
      
      // Refetch todos os dados em paralelo
      await Promise.all([
        refetchAuction(),
        refetchLots(),
        refetchBids()
      ]);
      
      // Aguardar que os states sejam atualizados e recalcular
      setTimeout(async () => {
        const freshNextBidValue = recalculateNextBidValue();
        setNextBidValue(freshNextBidValue);
        
        // Validar limite antes de abrir o modal de lance
        if (user?.id && auction?.id) {
          console.log('🔍 Validando limite de lance...');
          const validation = await validateBidLimit(user.id, auction.id, freshNextBidValue);
          
          if (!validation.canBid && !validation.isUnlimited) {
            console.log('⚠️ Limite de lance atingido!', validation);
            
            // Determinar qual lote será usado
            const targetLot = (hasPreBiddingLots && selectedPreBiddingLotId) 
              ? preBiddingLots.find(lot => lot.id === selectedPreBiddingLotId) || currentLot
              : currentLot;
            
            const targetLotId = targetLot?.id || '';
            
            // Registrar tentativa falhada
            await logFailedBidAttempt(
              user.id,
              auction.id,
              targetLotId,
              freshNextBidValue,
              validation.currentLimit,
              validation.totalBidsUsed
            );
            
            // Mostrar modal de limite atingido
            setLimitReachedData({
              currentLimit: validation.currentLimit,
              totalBidsUsed: validation.totalBidsUsed,
              attemptedBidValue: freshNextBidValue,
              auctionItemId: targetLotId
            });
            setShowLimitReachedDialog(true);
            return;
          }
        }
        
        console.log('📊 Dados atualizados. Próximo lance recalculado:', freshNextBidValue);
        setShowBidDialog(true);
      }, 200);
      
    } catch (error) {
      console.error('❌ Erro ao atualizar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar dados. Tente novamente.",
        variant: "destructive"
      });
    }
  };

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
        
        // Check if user was manually disabled
        const wasManuallyDisabled = registration?.status === 'disabled';
        
        return {
          title: wasManuallyDisabled ? 'Habilitação Desabilitada' : 'Habilitação Necessária',
          description: wasManuallyDisabled 
            ? 'Sua habilitação foi desabilitada. Você pode solicitar uma nova habilitação.' 
            : 'Você precisa se habilitar para participar deste leilão.',
          action: wasManuallyDisabled ? 'Solicitar Nova Habilitação' : 'Solicitar Habilitação',
          variant: wasManuallyDisabled ? 'destructive' as const : 'default' as const,
          icon: wasManuallyDisabled ? AlertCircle : User,
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
          onClick: anyPendingBid && !userPendingBid ? null : openBidDialogComAtualizacao,
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
  const canPreBid = hasPreBiddingLots && userState === 'can_bid' && !submittingBid;

  // Função melhorada para submission de lance
  const handleBidSubmission = async () => {
    try {
      // Pré-checagem: atualizar dados e validar o mínimo exigido antes de enviar
      await Promise.all([
        refetchAuction(),
        refetchLots(),
        refetchBids()
      ]);

      const freshNextMin = recalculateNextBidValue();
      if (!freshNextMin) return;

      if (nextBidValue < freshNextMin) {
        setNextBidValue(freshNextMin);
        const newInc = Math.max(1, Math.round(freshNextMin - currentBaseValue));
        updateCustomIncrement(newInc);
        // Garante que o diálogo exiba a base correta
        setCurrentBaseValue(freshNextMin - newInc);

        // Fechar modal atual e mostrar modal de superação
        setShowBidDialog(false);
        setOriginalBidValue(nextBidValue);
        setNextBidValue(freshNextMin);
        setShowOutbidModal(true);
        return;
      }

      console.log('💰 Tentando fazer lance com valor:', nextBidValue);
      // Passar lotId para pré-lances
      const targetLotId = hasPreBiddingLots && selectedPreBiddingLotId ? selectedPreBiddingLotId : undefined;
      const result = await submitBid(nextBidValue as any, targetLotId);

      if (result && (result as any).success) {
        setShowBidDialog(false);
        toast({
          title: "Lance aprovado!",
          description: "Seu lance foi aprovado automaticamente.",
          variant: "default"
        });
        return;
      }

      // Falha ao enviar o lance
      const resultMessage = (result as any)?.message;
      
      // Handle duplicate bid value error specifically
      if (resultMessage?.includes("Um lance com esse valor já foi recebido")) {
        // Fechar modal de confirmação atual
        setShowBidDialog(false);
        
        // Calcular próximo valor disponível
        const freshNextMin = recalculateNextBidValue();
        
        // Salvar valor duplicado e próximo valor
        setDuplicateBidValue(nextBidValue);
        setNextBidValue(freshNextMin);
        
        // Mostrar modal de lance duplicado
        setShowDuplicateBidModal(true);
        return;
      }
      
      const requiredMin = (result as any)?.requiredMin as number | undefined;
      if (requiredMin && requiredMin > 0) {
        // Fechar modal de confirmação atual
        setShowBidDialog(false);
        
        // Calcular novo lance como: lance pretendido + incremento
        const newBidValue = nextBidValue + customIncrement;
        // Garantir que não seja menor que o mínimo exigido pelo servidor
        const finalBidValue = Math.max(newBidValue, requiredMin);
        
        console.log('💰 Calculando valores para modal de superação:', {
          originalBid: nextBidValue,
          increment: customIncrement,
          newCalculated: newBidValue,
          requiredMin,
          finalBidValue
        });
        
        // Salvar valores para o modal de lance superado
        setOriginalBidValue(nextBidValue);
        setNextBidValue(finalBidValue);
        
        // Mostrar modal de lance superado
        setShowOutbidModal(true);
        return;
      }

      // Se não conseguimos extrair o mínimo exigido, faz o fallback de atualizar dados e recalcular
      console.log('⚠️ Lance falhou, atualizando dados e recalculando...');
      await Promise.all([
        refetchAuction(),
        refetchLots(),
        refetchBids()
      ]);

      // Aguardar atualização dos states e recalcular
      setTimeout(() => {
        const newCorrectValue = recalculateNextBidValue();
        
        // Calcular novo lance como: lance pretendido + incremento
        const newBidValue = nextBidValue + customIncrement;
        // Usar o maior entre o lance calculado e o valor recalculado
        const finalBidValue = Math.max(newBidValue, newCorrectValue);
        
        // Fechar modal atual e mostrar modal de superação com novo valor
        setShowBidDialog(false);
        setOriginalBidValue(nextBidValue);
        setNextBidValue(finalBidValue);
        setShowOutbidModal(true);

        console.log('🔄 Novo valor calculado após falha:', finalBidValue);
      }, 200);
    } catch (error) {
      console.error('❌ Erro ao enviar o lance:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar o lance. Recarregue a página.",
        variant: "destructive"
      });
    }
  };

  // Função para confirmar novo lance após duplicata
  const handleConfirmNewBid = async () => {
    setShowDuplicateBidModal(false);
    
    // Atualizar dados antes de tentar novamente
    await Promise.all([
      refetchAuction(),
      refetchLots(),
      refetchBids()
    ]);
    
    // Recalcular valor e tentar novo lance
    const freshNextMin = recalculateNextBidValue();
    setNextBidValue(freshNextMin);
    
    // Reabrir modal de confirmação com novo valor
    setShowBidDialog(true);
  };

  // Função para cancelar após duplicata
  const handleCancelDuplicateBid = () => {
    setShowDuplicateBidModal(false);
    // Reset para valores anteriores se necessário
  };

  // Funções para o modal de lance superado
  const handleProceedAfterOutbid = () => {
    setShowOutbidModal(false);
    // Reabrir modal de confirmação com o novo valor
    setShowBidDialog(true);
  };

  const handleCancelAfterOutbid = () => {
    setShowOutbidModal(false);
    // Reset para valores anteriores se necessário
  };

  return (
    <div className="min-h-screen bg-black">
      <AuctionRoomHeader />
      
      {/* Guest Mode Banner - show only if user is not logged in */}
      {!user && <GuestModeBanner className="container mx-auto px-4 mb-4" />}
      
      <div className="p-6 space-y-6 bg-black">
        {/* Header do Leilão */}
        <AuctionHeader auction={auction} lots={lots} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Coluna Principal - Transmissão (2/3 da tela) */}
          <div className="xl:col-span-2 space-y-0">
            {/* Video Player */}
            <AuctionVideoPlayer auction={auction} />
            
            {/* Lista de Lotes diretamente abaixo do vídeo */}
            {!lotsLoading && (
              <div className="mt-4">
                <LotsList
                  lots={lots}
                  bids={bids}
                  currentUserId={user?.id}
                  currentLotId={currentLotId}
                />
              </div>
            )}
          </div>

          {/* Coluna Lateral - Lote Atual e Ações (1/3 da tela) */}
          <div className="flex flex-col space-y-4" style={{ minHeight: 'calc(56.25vw * 2/3 + 200px)' }}>
            {/* Display do Lote - Atual ou Pré-Lance */}
            {hasActiveLot && currentLot && stateInfo ? (
              <CurrentLotDisplay
                currentLot={currentLot}
                auction={auction}
                bids={bids}
                customIncrement={customIncrement}
                onIncrementChange={updateCustomIncrement}
                nextBidValue={nextBidValue}
                onBidClick={openBidDialogComAtualizacao}
                canBid={canBid}
                userState={userState}
                stateInfo={stateInfo}
                submittingBid={submittingBid}
                userPendingBid={userPendingBid}
                userId={user?.id}
                onRequestRegistration={requestRegistration}
                hasOpenLots={!isAllFinished}
              />
            ) : hasPreBiddingLots && selectedPreBiddingLotId && preBiddingLots.find(lot => lot.id === selectedPreBiddingLotId) && stateInfo && userState === 'can_bid' ? (
              <PreBiddingLotDisplay
                selectedLot={preBiddingLots.find(lot => lot.id === selectedPreBiddingLotId)!}
                preBiddingLots={preBiddingLots}
                auction={auction}
                bids={bids}
                customIncrement={customIncrement}
                onIncrementChange={updateCustomIncrement}
                nextBidValue={nextBidValue}
                onBidClick={() => openBidDialogComAtualizacao(selectedPreBiddingLotId)}
                onLotSelect={setSelectedPreBiddingLotId}
                submittingBid={submittingBid}
                userPendingBid={userPendingBid}
                userId={user?.id}
              />
            ) : null}

            {/* Ações do Usuário - apenas quando não há lote ativo E não está em modo pré-lance com lote selecionado */}
            {!hasActiveLot && (!hasPreBiddingLots || !selectedPreBiddingLotId || userState !== 'can_bid') && stateInfo && (
              <AuctionUserActions
                auction={auction}
                bids={bids}
                userState={userState}
                stateInfo={stateInfo}
                submittingBid={submittingBid}
                userPendingBid={userPendingBid}
                userId={user?.id}
                preBiddingLots={preBiddingLots}
                selectedLotId={selectedPreBiddingLotId}
                customIncrement={customIncrement}
                nextBidValue={nextBidValue}
                onBidClick={openBidDialogComAtualizacao}
                onRequestRegistration={requestRegistration}
                onLotSelect={setSelectedPreBiddingLotId}
                onIncrementChange={updateCustomIncrement}
              />
            )}

            {/* Status Summary */}
            <AuctionStatusSummary
              lots={lots}
              bids={bids}
              currentUserId={user?.id}
              preBiddingLots={preBiddingLots}
            />

            {/* Histórico de Lances */}
            <BidHistoryWithFilters
              bids={bids}
              lots={lots}
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
  currentValue={currentBaseValue}
  onConfirm={handleBidSubmission}
/>

{/* Duplicate Bid Modal */}
<DuplicateBidModal
  open={showDuplicateBidModal}
  onOpenChange={setShowDuplicateBidModal}
  currentBidValue={duplicateBidValue}
  nextAvailableValue={nextBidValue}
  onConfirmNewBid={handleConfirmNewBid}
  onCancel={handleCancelDuplicateBid}
/>

{/* Outbid Notification Modal */}
<OutbidNotificationModal
  open={showOutbidModal}
  onOpenChange={setShowOutbidModal}
  originalBidValue={originalBidValue}
  newBidValue={nextBidValue}
  onProceed={handleProceedAfterOutbid}
  onCancel={handleCancelAfterOutbid}
/>

{/* Bid Limit Reached Dialog */}
{limitReachedData && user?.id && auction?.id && (
  <BidLimitReachedDialog
    open={showLimitReachedDialog}
    onOpenChange={setShowLimitReachedDialog}
    currentLimit={limitReachedData.currentLimit}
    totalBidsUsed={limitReachedData.totalBidsUsed}
    attemptedBidValue={limitReachedData.attemptedBidValue}
    userId={user.id}
    auctionId={auction.id}
    auctionItemId={limitReachedData.auctionItemId}
    onRequestSent={() => {
      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação de aumento de limite foi enviada para análise"
      });
    }}
  />
)}

      {/* Client Notifications - Fixed position */}
      <div className="fixed top-20 right-4 z-40">
        <ClientNotifications auctionId={id} />
      </div>
    </div>
  );
};

export default AuctionRoom;
