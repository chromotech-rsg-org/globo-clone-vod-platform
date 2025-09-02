
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Check, X } from 'lucide-react';

interface Registration {
  id: string;
  user_id: string;
  auction_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  client_notes?: string;
  internal_notes?: string;
  approved_by?: string;
}

interface RegistrationDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registration: Registration | null;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

const getStatusDisplay = (status: string) => {
  const statusMap: { [key: string]: string } = {
    'pending': 'Pendente',
    'approved': 'Aprovado',
    'rejected': 'Rejeitado',
    'canceled': 'Cancelado',
    'reopened': 'Reaberto'
  };
  return statusMap[status] || status;
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'approved':
      return 'admin-success';
    case 'rejected':
    case 'canceled':
      return 'admin-danger';
    case 'pending':
    case 'reopened':
      return 'secondary';
    default:
      return 'outline';
  }
};

const RegistrationDetailsModal: React.FC<RegistrationDetailsModalProps> = ({
  open,
  onOpenChange,
  registration,
  onApprove,
  onReject
}) => {
  if (!registration) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-admin-modal-bg text-admin-modal-text border-admin-border">
        <DialogHeader>
          <DialogTitle className="text-admin-modal-text">
            Detalhes da Habilitação
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-admin-muted-foreground">ID da Habilitação</label>
              <p className="text-admin-modal-text font-mono text-sm">{registration.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-admin-muted-foreground">Status</label>
              <div className="mt-1">
                <Badge variant={getStatusVariant(registration.status)}>
                  {getStatusDisplay(registration.status)}
                </Badge>
              </div>
            </div>
          </div>

          <Separator className="border-admin-border" />

          {/* Auction and User Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-admin-muted-foreground">ID do Leilão</label>
              <p className="text-admin-modal-text font-mono text-sm">{registration.auction_id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-admin-muted-foreground">ID do Usuário</label>
              <p className="text-admin-modal-text font-mono text-sm">{registration.user_id}</p>
            </div>
          </div>

          <Separator className="border-admin-border" />

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-admin-muted-foreground">Solicitado em</label>
              <p className="text-admin-modal-text">
                {new Date(registration.created_at).toLocaleString('pt-BR')}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-admin-muted-foreground">Atualizado em</label>
              <p className="text-admin-modal-text">
                {new Date(registration.updated_at).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          {/* Approved By */}
          {registration.approved_by && (
            <div>
              <label className="text-sm font-medium text-admin-muted-foreground">Aprovado por</label>
              <p className="text-admin-modal-text font-mono text-sm">{registration.approved_by}</p>
            </div>
          )}

          {/* Notes */}
          {(registration.internal_notes || registration.client_notes) && (
            <>
              <Separator className="border-admin-border" />
              <div className="space-y-4">
                {registration.client_notes && (
                  <div>
                    <label className="text-sm font-medium text-admin-muted-foreground">Observações do Cliente</label>
                    <p className="text-admin-modal-text bg-admin-content-bg p-3 rounded border border-admin-border">
                      {registration.client_notes}
                    </p>
                  </div>
                )}
                {registration.internal_notes && (
                  <div>
                    <label className="text-sm font-medium text-admin-muted-foreground">Observações Internas</label>
                    <p className="text-admin-modal-text bg-admin-content-bg p-3 rounded border border-admin-border">
                      {registration.internal_notes}
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
            
            {registration.status === 'pending' && (
              <div className="space-x-2">
                {onReject && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      onReject(registration.id);
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
                      onApprove(registration.id);
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

export default RegistrationDetailsModal;
