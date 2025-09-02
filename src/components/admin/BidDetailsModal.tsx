
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Check, X } from 'lucide-react';

interface Bid {
  id: string;
  auction_id: string;
  user_id: string;
  auction_item_id: string;
  bid_value: number;
  status: string;
  created_at: string;
  updated_at: string;
  approved_by?: string;
  is_winner: boolean;
  internal_notes?: string;
  client_notes?: string;
}

interface BidDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bid: Bid | null;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

const getStatusDisplay = (status: string) => {
  const statusMap: { [key: string]: string } = {
    'pending': 'Pendente',
    'approved': 'Aprovado',
    'rejected': 'Rejeitado',
    'superseded': 'Superado'
  };
  return statusMap[status] || status;
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'approved':
      return 'admin-success';
    case 'rejected':
      return 'admin-danger';
    case 'pending':
      return 'secondary';
    default:
      return 'outline';
  }
};

const BidDetailsModal: React.FC<BidDetailsModalProps> = ({
  open,
  onOpenChange,
  bid,
  onApprove,
  onReject
}) => {
  if (!bid) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-admin-modal-bg text-admin-modal-text border-admin-border">
        <DialogHeader>
          <DialogTitle className="text-admin-modal-text">
            Detalhes do Lance
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-admin-muted-foreground">ID do Lance</label>
              <p className="text-admin-modal-text font-mono text-sm">{bid.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-admin-muted-foreground">Status</label>
              <div className="mt-1">
                <Badge variant={getStatusVariant(bid.status)}>
                  {getStatusDisplay(bid.status)}
                </Badge>
              </div>
            </div>
          </div>

          <Separator className="border-admin-border" />

          {/* Auction and User Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-admin-muted-foreground">ID do Leilão</label>
              <p className="text-admin-modal-text font-mono text-sm">{bid.auction_id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-admin-muted-foreground">ID do Usuário</label>
              <p className="text-admin-modal-text font-mono text-sm">{bid.user_id}</p>
            </div>
          </div>

          {/* Bid Value */}
          <div>
            <label className="text-sm font-medium text-admin-muted-foreground">Valor do Lance</label>
            <p className="text-2xl font-bold text-admin-modal-text">
              R$ {bid.bid_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <Separator className="border-admin-border" />

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-admin-muted-foreground">Criado em</label>
              <p className="text-admin-modal-text">
                {new Date(bid.created_at).toLocaleString('pt-BR')}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-admin-muted-foreground">Atualizado em</label>
              <p className="text-admin-modal-text">
                {new Date(bid.updated_at).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          {/* Winner Status */}
          {bid.is_winner && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <p className="text-green-400 font-semibold">🏆 Lance Vencedor</p>
            </div>
          )}

          {/* Notes */}
          {(bid.internal_notes || bid.client_notes) && (
            <>
              <Separator className="border-admin-border" />
              <div className="space-y-4">
                {bid.client_notes && (
                  <div>
                    <label className="text-sm font-medium text-admin-muted-foreground">Observações do Cliente</label>
                    <p className="text-admin-modal-text bg-admin-content-bg p-3 rounded border border-admin-border">
                      {bid.client_notes}
                    </p>
                  </div>
                )}
                {bid.internal_notes && (
                  <div>
                    <label className="text-sm font-medium text-admin-muted-foreground">Observações Internas</label>
                    <p className="text-admin-modal-text bg-admin-content-bg p-3 rounded border border-admin-border">
                      {bid.internal_notes}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t border-admin-border">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-admin-border"
            >
              Fechar
            </Button>
            
            {bid.status === 'pending' && (
              <div className="space-x-2">
                {onReject && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      onReject(bid.id);
                      onOpenChange(false);
                    }}
                    className="border-red-500 text-red-500 hover:bg-red-500/10"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Rejeitar
                  </Button>
                )}
                {onApprove && (
                  <Button 
                    onClick={() => {
                      onApprove(bid.id);
                      onOpenChange(false);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Aprovar
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BidDetailsModal;
