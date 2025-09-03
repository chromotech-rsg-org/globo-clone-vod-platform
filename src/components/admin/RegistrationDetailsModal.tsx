import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Check, X, RotateCcw, Save, User, Calendar, Mail, Phone, IdCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

interface UserProfile {
  id: string;
  name: string;
  email: string;
  cpf?: string;
  phone?: string;
  role: string;
  created_at: string;
}

interface AuctionData {
  id: string;
  name: string;
  description?: string;
  auction_type: string;
  status: string;
  created_at: string;
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [auctionData, setAuctionData] = useState<AuctionData | null>(null);
  const [internalNotes, setInternalNotes] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Fetch user profile and auction data when registration changes
  useEffect(() => {
    if (registration && open) {
      fetchAdditionalData();
      setInternalNotes(registration.internal_notes || '');
      setClientNotes(registration.client_notes || '');
    }
  }, [registration, open]);

  const fetchAdditionalData = async () => {
    if (!registration) return;

    setLoading(true);
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, email, cpf, phone, role, created_at')
        .eq('id', registration.user_id)
        .single();

      if (profileError) throw profileError;
      setUserProfile(profileData);

      // Fetch auction data
      const { data: auctionData, error: auctionError } = await supabase
        .from('auctions')
        .select('id, name, description, auction_type, status, created_at')
        .eq('id', registration.auction_id)
        .single();

      if (auctionError) throw auctionError;
      setAuctionData(auctionData);
    } catch (error) {
      console.error('Erro ao buscar dados adicionais:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar todos os dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!registration) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('auction_registrations')
        .update({
          internal_notes: internalNotes,
          client_notes: clientNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', registration.id);

      if (error) throw error;

      // Send email notification if client notes were added/changed
      if (clientNotes && clientNotes !== registration.client_notes && userProfile) {
        try {
          await supabase.functions.invoke('send-registration-notification', {
            body: {
              userEmail: userProfile.email,
              userName: userProfile.name,
              auctionName: auctionData?.name || 'Leilão',
              status: registration.status,
              clientNotes: clientNotes
            }
          });
        } catch (emailError) {
          console.error('Erro ao enviar email:', emailError);
          // Don't fail the save operation if email fails
        }
      }

      toast({
        title: "Sucesso",
        description: "Observações salvas com sucesso",
      });

      // Update the registration object with new notes
      Object.assign(registration, { internal_notes: internalNotes, client_notes: clientNotes });
      
    } catch (error) {
      console.error('Erro ao salvar observações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as observações",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!registration) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-admin-modal-bg text-admin-modal-text border-admin-border overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-admin-modal-text flex items-center gap-2">
            <User className="h-5 w-5" />
            Detalhes da Habilitação
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Registration Basic Information */}
          <div className="bg-admin-card p-4 rounded-lg border border-admin-border">
            <h3 className="font-semibold mb-4 text-admin-modal-text flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Informações da Habilitação
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-admin-muted-foreground">ID da Habilitação</label>
                <p className="text-admin-modal-text font-mono text-sm break-all">{registration.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-admin-muted-foreground">Status</label>
                <div className="mt-1">
                  <Badge variant={getStatusVariant(registration.status)}>
                    {getStatusDisplay(registration.status)}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-admin-muted-foreground">Solicitado em</label>
                <p className="text-admin-modal-text text-sm">
                  {new Date(registration.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-sm font-medium text-admin-muted-foreground">Atualizado em</label>
                <p className="text-admin-modal-text text-sm">
                  {new Date(registration.updated_at).toLocaleString('pt-BR')}
                </p>
              </div>
              {registration.approved_by && (
                <div>
                  <label className="text-sm font-medium text-admin-muted-foreground">Aprovado por</label>
                  <p className="text-admin-modal-text font-mono text-sm break-all">{registration.approved_by}</p>
                </div>
              )}
            </div>
          </div>

          {/* User Information */}
          {loading ? (
            <div className="bg-admin-card p-4 rounded-lg border border-admin-border">
              <p className="text-admin-muted-foreground">Carregando dados do usuário...</p>
            </div>
          ) : userProfile ? (
            <div className="bg-admin-card p-4 rounded-lg border border-admin-border">
              <h3 className="font-semibold mb-4 text-admin-modal-text flex items-center gap-2">
                <User className="h-4 w-4" />
                Dados do Usuário
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-admin-muted-foreground">Nome</label>
                  <p className="text-admin-modal-text">{userProfile.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-admin-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Email
                  </label>
                  <p className="text-admin-modal-text">{userProfile.email}</p>
                </div>
                {userProfile.cpf && (
                  <div>
                    <label className="text-sm font-medium text-admin-muted-foreground flex items-center gap-1">
                      <IdCard className="h-3 w-3" />
                      CPF
                    </label>
                    <p className="text-admin-modal-text">{userProfile.cpf}</p>
                  </div>
                )}
                {userProfile.phone && (
                  <div>
                    <label className="text-sm font-medium text-admin-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      Telefone
                    </label>
                    <p className="text-admin-modal-text">{userProfile.phone}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-admin-muted-foreground">Tipo de Usuário</label>
                  <p className="text-admin-modal-text capitalize">{userProfile.role}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-admin-muted-foreground">Cadastrado em</label>
                  <p className="text-admin-modal-text text-sm">
                    {new Date(userProfile.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-admin-card p-4 rounded-lg border border-admin-border">
              <p className="text-admin-muted-foreground">Não foi possível carregar os dados do usuário</p>
            </div>
          )}

          {/* Auction Information */}
          {auctionData && (
            <div className="bg-admin-card p-4 rounded-lg border border-admin-border">
              <h3 className="font-semibold mb-4 text-admin-modal-text flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Dados do Leilão
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-admin-muted-foreground">Nome do Leilão</label>
                  <p className="text-admin-modal-text font-medium">{auctionData.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-admin-muted-foreground">Tipo</label>
                  <p className="text-admin-modal-text capitalize">{auctionData.auction_type}</p>
                </div>
                {auctionData.description && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-admin-muted-foreground">Descrição</label>
                    <p className="text-admin-modal-text">{auctionData.description}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-admin-muted-foreground">Status do Leilão</label>
                  <p className="text-admin-modal-text capitalize">{auctionData.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-admin-muted-foreground">Criado em</label>
                  <p className="text-admin-modal-text text-sm">
                    {new Date(auctionData.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          )}

          <Separator className="border-admin-border" />

          {/* Notes Section */}
          <div className="bg-admin-card p-4 rounded-lg border border-admin-border">
            <h3 className="font-semibold mb-4 text-admin-modal-text">Observações</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="internal-notes" className="text-admin-modal-text">
                  Observação Interna (não será enviada ao cliente)
                </Label>
                <Textarea
                  id="internal-notes"
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Digite observações internas sobre esta habilitação..."
                  className="mt-1 bg-admin-content-bg border-admin-border text-admin-modal-text"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="client-notes" className="text-admin-modal-text">
                  Observação para o Cliente (será enviada por email)
                </Label>
                <Textarea
                  id="client-notes"
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  placeholder="Digite observações que serão enviadas ao cliente por email..."
                  className="mt-1 bg-admin-content-bg border-admin-border text-admin-modal-text"
                  rows={3}
                />
              </div>
              
              <Button
                onClick={handleSaveNotes}
                disabled={saving}
                className="bg-admin-primary hover:bg-admin-primary/90 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Observações'}
              </Button>
            </div>
          </div>

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
