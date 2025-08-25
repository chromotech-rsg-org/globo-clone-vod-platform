
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Clock, Users, Bell } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import IndividualEditModal from './IndividualEditModal';

interface PendingItem {
  id: string;
  type: 'bid' | 'registration';
  auction_name: string;
  user_name: string;
  value?: number;
  created_at: string;
}

interface PendingNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingBids: PendingItem[];
  pendingRegistrations: PendingItem[];
  onRefetch?: () => void;
}

const PendingNotificationModal = ({
  isOpen,
  onClose,
  pendingBids,
  pendingRegistrations,
  onRefetch
}: PendingNotificationModalProps) => {
  const [selectedItem, setSelectedItem] = useState<PendingItem | null>(null);
  const [isIndividualModalOpen, setIsIndividualModalOpen] = useState(false);

  const handleItemClick = (item: PendingItem) => {
    setSelectedItem(item);
    setIsIndividualModalOpen(true);
  };

  const handleIndividualModalClose = () => {
    setIsIndividualModalOpen(false);
    setSelectedItem(null);
    onClose(); // Return to main notifications modal
  };

  const handleItemSaved = () => {
    if (onRefetch) {
      onRefetch();
    }
    handleIndividualModalClose();
  };

  const totalPending = pendingBids.length + pendingRegistrations.length;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações Pendentes ({totalPending})
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {pendingBids.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <Clock className="h-4 w-4" />
                  Lances Pendentes ({pendingBids.length})
                </h3>
                <div className="space-y-2">
                  {pendingBids.map((bid) => (
                    <div
                      key={bid.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleItemClick(bid)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary">Lance</Badge>
                          <span className="font-medium">{bid.user_name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {bid.auction_name}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Valor: {formatCurrency(bid.value || 0)}</span>
                          <span>
                            {formatDistanceToNow(new Date(bid.created_at), {
                              addSuffix: true,
                              locale: ptBR
                            })}
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="ml-4">
                        <Eye className="h-4 w-4 mr-1" />
                        Revisar
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingRegistrations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <Users className="h-4 w-4" />
                  Habilitações Pendentes ({pendingRegistrations.length})
                </h3>
                <div className="space-y-2">
                  {pendingRegistrations.map((registration) => (
                    <div
                      key={registration.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleItemClick(registration)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">Habilitação</Badge>
                          <span className="font-medium">{registration.user_name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {registration.auction_name}
                        </p>
                        <div className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(registration.created_at), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="ml-4">
                        <Eye className="h-4 w-4 mr-1" />
                        Revisar
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {totalPending === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma notificação pendente</p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <IndividualEditModal
        isOpen={isIndividualModalOpen}
        onClose={handleIndividualModalClose}
        item={selectedItem}
        onSaved={handleItemSaved}
      />
    </>
  );
};

export default PendingNotificationModal;
