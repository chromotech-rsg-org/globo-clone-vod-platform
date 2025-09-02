
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Check, X, RotateCcw } from 'lucide-react';

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
  onRevert?: (id: string) => void;
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
  onReject,
  onRevert
}) => {
  if (!registration) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-gray-900 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">
            Detalhes da Habilitação
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-300">ID da Habilitação</label>
              <p className="text-white font-mono text-sm">{registration.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">Status</label>
              <div className="mt-1">
                <Badge variant={getStatusVariant(registration.status)}>
                  {getStatusDisplay(registration.status)}
                </Badge>
              </div>
            </div>
          </div>

          <Separator className="border-gray-700" />

          {/* Auction and User Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-300">ID do Leilão</label>
              <p className="text-white font-mono text-sm">{registration.auction_id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">ID do Usuário</label>
              <p className="text-white font-mono text-sm">{registration.user_id}</p>
            </div>
          </div>

          <Separator className="border-gray-700" />

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-300">Solicitado em</label>
              <p className="text-white">
                {new Date(registration.created_at).toLocaleString('pt-BR')}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">Atualizado em</label>
              <p className="text-white">
                {new Date(registration.updated_at).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          {/* Approved By */}
          {registration.approved_by && (
            <div>
              <label className="text-sm font-medium text-gray-300">Aprovado por</label>
              <p className="text-white font-mono text-sm">{registration.approved_by}</p>
            </div>
          )}

          {/* Notes */}
          {(registration.internal_notes || registration.client_notes) && (
            <>
              <Separator className="border-gray-700" />
              <div className="space-y-4">
                {registration.client_notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-300">Observações do Cliente</label>
                    <p className="text-white bg-gray-800 p-3 rounded border border-gray-700">
                      {registration.client_notes}
                    </p>
                  </div>
                )}
                {registration.internal_notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-300">Observações Internas</label>
                    <p className="text-white bg-gray-800 p-3 rounded border border-gray-700">
                      {registration.internal_notes}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t border-gray-700">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-gray-600 text-black bg-white hover:bg-gray-100"
            >
              Fechar
            </Button>
            
            <div className="space-x-2">
              {/* Pending status actions */}
              {registration.status === 'pending' && (
                <>
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
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Aprovar
                    </Button>
                  )}
                </>
              )}

              {/* Approved status actions */}
              {registration.status === 'approved' && onRevert && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    onRevert(registration.id);
                    onOpenChange(false);
                  }}
                  className="border-orange-500 text-orange-500 hover:bg-orange-500/10"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reverter para Pendente
                </Button>
              )}

              {/* Rejected status actions */}
              {registration.status === 'rejected' && (
                <>
                  {onApprove && (
                    <Button 
                      onClick={() => {
                        onApprove(registration.id);
                        onOpenChange(false);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Aprovar
                    </Button>
                  )}
                  {onRevert && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        onRevert(registration.id);
                        onOpenChange(false);
                      }}
                      className="border-orange-500 text-orange-500 hover:bg-orange-500/10"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reverter para Pendente
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RegistrationDetailsModal;
