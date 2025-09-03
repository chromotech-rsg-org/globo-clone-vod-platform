import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gavel, Users, ArrowRight, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PendingNotificationItem from './PendingNotificationItem';
interface PendingItem {
  id: string;
  type: 'bid' | 'registration';
  auction_name: string;
  user_name: string;
  value?: number;
  created_at: string;
}
interface PendingNotificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingBids: PendingItem[];
  pendingRegistrations: PendingItem[];
}
const PendingNotificationModal: React.FC<PendingNotificationModalProps> = ({
  open,
  onOpenChange,
  pendingBids,
  pendingRegistrations
}) => {
  const navigate = useNavigate();
  const handleGoToBids = () => {
    navigate('/admin/lances');
    onOpenChange(false);
  };
  const handleGoToRegistrations = () => {
    navigate('/admin/habilitacoes');
    onOpenChange(false);
  };
  const handleItemClick = (item: PendingItem) => {
    // Close current modal
    onOpenChange(false);

    // Navigate directly to the edit page for the specific item
    if (item.type === 'bid') {
      // Navigate to bids page and trigger edit for specific bid
      navigate(`/admin/lances`, {
        state: {
          editBidId: item.id,
          returnToNotifications: true
        }
      });
    } else {
      // Navigate to registrations page and trigger edit for specific registration
      navigate(`/admin/habilitacoes`, {
        state: {
          editRegistrationId: item.id,
          returnToNotifications: true
        }
      });
    }
  };
  const totalPending = pendingBids.length + pendingRegistrations.length;
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] bg-black/95 text-admin-modal-text border-admin-border backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-admin-modal-text">
            <Bell className="h-5 w-5" />
            Notificações Pendentes ({totalPending})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pr-2">
          {/* Lances Pendentes */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-admin-modal-text">
                <Gavel className="h-5 w-5" />
                Lances Pendentes ({pendingBids.length})
              </h3>
              {pendingBids.length > 0 && <Button onClick={handleGoToBids} variant="outline" size="sm" className="border-admin-border text-white">
                  Ver Todos <ArrowRight className="h-4 w-4 ml-1" />
                </Button>}
            </div>

            {pendingBids.length === 0 ? <div className="text-center text-admin-muted-foreground py-8">
                Nenhum lance pendente
              </div> : <div className="space-y-2 max-h-48">
                {pendingBids.slice(0, 5).map(bid => <PendingNotificationItem key={bid.id} item={bid} onClick={handleItemClick} />)}
                {pendingBids.length > 5 && <p className="text-center text-sm text-admin-muted-foreground pt-2">
                    +{pendingBids.length - 5} lances adicionais
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
              {pendingRegistrations.length > 0 && <Button onClick={handleGoToRegistrations} variant="outline" size="sm" className="border-admin-border text-slate-950">
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
            <Button variant="outline" onClick={() => onOpenChange(false)} className="border-admin-border text-slate-950">
              Fechar
            </Button>
            <div className="space-x-2">
              {pendingBids.length > 0 && <Button onClick={handleGoToBids} className="bg-admin-primary hover:bg-admin-primary/90">
                  Gerenciar Lances
                </Button>}
              {pendingRegistrations.length > 0 && <Button onClick={handleGoToRegistrations} className="bg-admin-primary hover:bg-admin-primary/90">
                  Gerenciar Habilitações
                </Button>}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};
export default PendingNotificationModal;