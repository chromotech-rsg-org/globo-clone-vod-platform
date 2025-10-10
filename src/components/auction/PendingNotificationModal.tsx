import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gavel, Users, ArrowRight, Bell, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import PendingNotificationItem from './PendingNotificationItem';
import BidDetailsModal from '@/components/admin/BidDetailsModal';
import RegistrationDetailsModal from '@/components/admin/RegistrationDetailsModal';
import { ReviewRequestModal } from '@/components/admin/ReviewRequestModal';
import { useBidLimits } from '@/hooks/useBidLimits';
interface PendingItem {
  id: string;
  type: 'bid' | 'registration' | 'limit_request';
  auction_name?: string;
  user_name: string;
  value?: number;
  created_at: string;
  requested_limit?: number;
  current_limit?: number;
}
interface PendingNotificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingBids: PendingItem[];
  pendingRegistrations: PendingItem[];
  pendingLimitRequests: PendingItem[];
}
const PendingNotificationModal: React.FC<PendingNotificationModalProps> = ({
  open,
  onOpenChange,
  pendingBids,
  pendingRegistrations,
  pendingLimitRequests
}) => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [selectedBid, setSelectedBid] = useState<any>(null);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [selectedLimitRequest, setSelectedLimitRequest] = useState<any>(null);
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
  const [limitRequestModalOpen, setLimitRequestModalOpen] = useState(false);
  const {
    reviewLimitRequest
  } = useBidLimits();
  const handleGoToBids = () => {
    navigate('/admin/lances');
    onOpenChange(false);
  };
  const handleGoToRegistrations = () => {
    navigate('/admin/habilitacoes');
    onOpenChange(false);
  };
  const handleGoToLimitRequests = () => {
    navigate('/admin/limites-clientes');
    onOpenChange(false);
  };
  const handleItemClick = async (item: PendingItem) => {
    try {
      if (item.type === 'bid') {
        // Fetch full bid details
        const {
          data: bidData,
          error
        } = await supabase.from('bids').select('*').eq('id', item.id).single();
        if (error) throw error;
        setSelectedBid(bidData);
        setBidModalOpen(true);
      } else if (item.type === 'registration') {
        // Fetch full registration details
        const {
          data: registrationData,
          error
        } = await supabase.from('auction_registrations').select('*').eq('id', item.id).single();
        if (error) throw error;
        setSelectedRegistration(registrationData);
        setRegistrationModalOpen(true);
      } else if (item.type === 'limit_request') {
        // Fetch full limit request details
        const {
          data: requestData,
          error: requestError
        } = await supabase.from('limit_increase_requests').select('*').eq('id', item.id).maybeSingle();
        if (requestError) throw requestError;
        if (!requestData) {
          throw new Error('Solicitação não encontrada');
        }

        // Fetch user data separately
        const {
          data: userData
        } = await supabase.from('profiles').select('name, email').eq('id', requestData.user_id).maybeSingle();
        setSelectedLimitRequest({
          ...requestData,
          user: userData
        });
        setLimitRequestModalOpen(true);
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes",
        variant: "destructive"
      });
    }
  };
  const handleBidApprove = async (id: string) => {
    try {
      const {
        error
      } = await supabase.from('bids').update({
        status: 'approved',
        approved_by: (await supabase.auth.getUser()).data.user?.id,
        updated_at: new Date().toISOString()
      }).eq('id', id);
      if (error) throw error;
      toast({
        title: "Sucesso",
        description: "Lance aprovado com sucesso"
      });
      setBidModalOpen(false);
      // Trigger refresh of parent component if needed
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível aprovar o lance",
        variant: "destructive"
      });
    }
  };
  const handleBidReject = async (id: string) => {
    const reason = prompt('Motivo da rejeição (opcional):');
    try {
      const {
        error
      } = await supabase.from('bids').update({
        status: 'rejected',
        client_notes: reason || 'Lance rejeitado',
        approved_by: (await supabase.auth.getUser()).data.user?.id,
        updated_at: new Date().toISOString()
      }).eq('id', id);
      if (error) throw error;
      toast({
        title: "Sucesso",
        description: "Lance rejeitado"
      });
      setBidModalOpen(false);
    } catch (error) {
      console.error('Erro ao rejeitar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar o lance",
        variant: "destructive"
      });
    }
  };
  const handleRegistrationApprove = async (id: string) => {
    try {
      const {
        error
      } = await supabase.from('auction_registrations').update({
        status: 'approved',
        approved_by: (await supabase.auth.getUser()).data.user?.id,
        updated_at: new Date().toISOString()
      }).eq('id', id);
      if (error) throw error;
      toast({
        title: "Sucesso",
        description: "Habilitação aprovada com sucesso"
      });
      setRegistrationModalOpen(false);
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível aprovar a habilitação",
        variant: "destructive"
      });
    }
  };
  const handleRegistrationReject = async (id: string) => {
    const reason = prompt('Motivo da rejeição (opcional):');
    try {
      const {
        error
      } = await supabase.from('auction_registrations').update({
        status: 'rejected',
        client_notes: reason || 'Habilitação rejeitada',
        approved_by: (await supabase.auth.getUser()).data.user?.id,
        updated_at: new Date().toISOString()
      }).eq('id', id);
      if (error) throw error;
      toast({
        title: "Sucesso",
        description: "Habilitação rejeitada"
      });
      setRegistrationModalOpen(false);
    } catch (error) {
      console.error('Erro ao rejeitar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar a habilitação",
        variant: "destructive"
      });
    }
  };
  const totalPending = pendingRegistrations.length + pendingLimitRequests.length;
  return <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] bg-black/95 text-admin-modal-text border-admin-border backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-admin-modal-text">
              <Bell className="h-5 w-5" />
              Notificações Pendentes ({totalPending})
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pr-2">
            {/* Solicitações de Aumento de Limite */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-admin-modal-text">
                  <TrendingUp className="h-5 w-5" />
                  Aumento de Limite Pendentes ({pendingLimitRequests.length})
                </h3>
                {pendingLimitRequests.length > 0 && <Button onClick={handleGoToLimitRequests} variant="outline" size="sm" className="border-admin-border text-center text-slate-50">
                    Ver Todos <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>}
              </div>

              {pendingLimitRequests.length === 0 ? <div className="text-center text-admin-muted-foreground py-8">
                  Nenhuma solicitação pendente
                </div> : <div className="space-y-2 max-h-48">
                  {pendingLimitRequests.slice(0, 5).map(request => <PendingNotificationItem key={request.id} item={request} onClick={handleItemClick} />)}
                  {pendingLimitRequests.length > 5 && <p className="text-center text-sm text-admin-muted-foreground pt-2">
                      +{pendingLimitRequests.length - 5} solicitações adicionais
                    </p>}
                </div>}
            </div>


            {/* Habilitações Pendentes */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-admin-modal-text">
                  <Users className="h-5 w-5" />
                  Habilitações Pendentes ({pendingRegistrations.length})
                </h3>
                {pendingRegistrations.length > 0 && <Button onClick={handleGoToRegistrations} variant="outline" size="sm" className="border-admin-border text-slate-50">
                    Ver Todas <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>}
              </div>

              {pendingRegistrations.length === 0 ? <div className="text-center text-admin-muted-foreground py-8">
                  Nenhuma habilitação pendente
                </div> : <div className="space-y-2 max-h-48">
                  {pendingRegistrations.slice(0, 5).map(registration => <PendingNotificationItem key={registration.id} item={registration} onClick={handleItemClick} />)}
                  {pendingRegistrations.length > 5 && <p className="text-center text-sm text-admin-muted-foreground pt-2">
                      +{pendingRegistrations.length - 5} habilitações adicionais
                    </p>}
                </div>}
            </div>

            {/* Botões de Ação */}
            <div className="flex justify-between pt-4 border-t border-admin-border">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="border-admin-border text-admin-modal-text">
                Fechar
              </Button>
              <div className="space-x-2">
                {pendingLimitRequests.length > 0 && <Button onClick={handleGoToLimitRequests} className="bg-admin-primary hover:bg-admin-primary/90">
                    Gerenciar Limites
                  </Button>}
                {pendingRegistrations.length > 0 && <Button onClick={handleGoToRegistrations} className="bg-admin-primary hover:bg-admin-primary/90">
                    Gerenciar Habilitações
                  </Button>}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BidDetailsModal open={bidModalOpen} onOpenChange={setBidModalOpen} bid={selectedBid} onApprove={handleBidApprove} onReject={handleBidReject} />

      <RegistrationDetailsModal open={registrationModalOpen} onOpenChange={setRegistrationModalOpen} registration={selectedRegistration} onApprove={handleRegistrationApprove} onReject={handleRegistrationReject} />

      <Dialog open={limitRequestModalOpen} onOpenChange={setLimitRequestModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gray-900 border-green-500/30">
          <DialogHeader>
            <DialogTitle className="text-white">Revisão de Solicitação de Limite</DialogTitle>
            <DialogDescription className="text-gray-400">
              Analise os dados do cliente e aprove ou rejeite a solicitação de aumento de limite
            </DialogDescription>
          </DialogHeader>
          {selectedLimitRequest && <ReviewRequestModal request={selectedLimitRequest} onApprove={async () => {
          await reviewLimitRequest(selectedLimitRequest.id, true, selectedLimitRequest.requested_limit);
          setLimitRequestModalOpen(false);
          setSelectedLimitRequest(null);
          toast({
            title: "Sucesso",
            description: "Solicitação aprovada com sucesso"
          });
        }} onReject={async () => {
          await reviewLimitRequest(selectedLimitRequest.id, false);
          setLimitRequestModalOpen(false);
          setSelectedLimitRequest(null);
          toast({
            title: "Sucesso",
            description: "Solicitação rejeitada"
          });
        }} />}
        </DialogContent>
      </Dialog>
    </>;
};
export default PendingNotificationModal;