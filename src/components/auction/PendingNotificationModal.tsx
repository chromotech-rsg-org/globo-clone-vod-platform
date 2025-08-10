import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Gavel, Users, Clock, ArrowRight, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
    navigate('/admin/bids?status=pending');
    onOpenChange(false);
  };

  const handleGoToRegistrations = () => {
    navigate('/admin/registrations?status=pending');
    onOpenChange(false);
  };

  const handleItemClick = (item: PendingItem) => {
    if (item.type === 'bid') {
      navigate(`/admin/bids?status=pending&bid=${item.id}`);
    } else {
      navigate(`/admin/registrations?status=pending&registration=${item.id}`);
    }
    onOpenChange(false);
  };

  const totalPending = pendingBids.length + pendingRegistrations.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações Pendentes ({totalPending})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Lances Pendentes */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Gavel className="h-5 w-5" />
                Lances Pendentes ({pendingBids.length})
              </h3>
              {pendingBids.length > 0 && (
                <Button onClick={handleGoToBids} variant="outline" size="sm">
                  Ver Todos <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>

            {pendingBids.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Nenhum lance pendente
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {pendingBids.slice(0, 5).map((bid) => (
                  <Card 
                    key={bid.id} 
                    className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleItemClick(bid)}
                  >
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{bid.auction_name}</p>
                          <p className="text-sm text-muted-foreground">
                            por {bid.user_name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary">
                            {formatCurrency(bid.value || 0)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(bid.created_at)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {pendingBids.length > 5 && (
                  <p className="text-center text-sm text-muted-foreground pt-2">
                    +{pendingBids.length - 5} lances adicionais
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Habilitações Pendentes */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Habilitações Pendentes ({pendingRegistrations.length})
              </h3>
              {pendingRegistrations.length > 0 && (
                <Button onClick={handleGoToRegistrations} variant="outline" size="sm">
                  Ver Todas <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>

            {pendingRegistrations.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Nenhuma habilitação pendente
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {pendingRegistrations.slice(0, 5).map((registration) => (
                  <Card 
                    key={registration.id} 
                    className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleItemClick(registration)}
                  >
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{registration.auction_name}</p>
                          <p className="text-sm text-muted-foreground">
                            por {registration.user_name}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            Pendente
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(registration.created_at)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {pendingRegistrations.length > 5 && (
                  <p className="text-center text-sm text-muted-foreground pt-2">
                    +{pendingRegistrations.length - 5} habilitações adicionais
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <div className="space-x-2">
              {pendingBids.length > 0 && (
                <Button onClick={handleGoToBids}>
                  Gerenciar Lances
                </Button>
              )}
              {pendingRegistrations.length > 0 && (
                <Button onClick={handleGoToRegistrations}>
                  Gerenciar Habilitações
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PendingNotificationModal;