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

      toast({
        title: "Sucesso",
        description: "Observações salvas com sucesso",
      });

      // Update the registration object with new notes
      Object.assign(registration, { internal_notes: internalNotes, client_notes: clientNotes });

    } catch (error: any) {
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

  const handleSaveNotesAndApprove = async () => {
    if (!registration || !onApprove) return;

    // Ensure client notes has default message if empty
    const finalClientNotes = clientNotes.trim() || 'Aprovado';
    setClientNotes(finalClientNotes);
    
    // Save notes with default message
    setSaving(true);
    try {
      const { error } = await supabase
        .from('auction_registrations')
        .update({
          internal_notes: internalNotes,
          client_notes: finalClientNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', registration.id);

      if (error) throw error;
      
      // Update the registration object with new notes
      Object.assign(registration, { internal_notes: internalNotes, client_notes: finalClientNotes });
    } catch (error) {
      console.error('Erro ao salvar observações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as observações",
        variant: "destructive",
      });
      setSaving(false);
      return;
    } finally {
      setSaving(false);
    }

    // Then approve
    onApprove(registration.id);
    onOpenChange(false);
  };

  const handleSaveNotesAndReject = async () => {
    if (!registration || !onReject) return;

    // Ensure client notes has default message if empty
    const finalClientNotes = clientNotes.trim() || 'Reprovado';
    setClientNotes(finalClientNotes);
    
    // Save notes with default message
    setSaving(true);
    try {
      const { error } = await supabase
        .from('auction_registrations')
        .update({
          internal_notes: internalNotes,
          client_notes: finalClientNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', registration.id);

      if (error) throw error;
      
      // Update the registration object with new notes
      Object.assign(registration, { internal_notes: internalNotes, client_notes: finalClientNotes });
    } catch (error) {
      console.error('Erro ao salvar observações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as observações",
        variant: "destructive",
      });
      setSaving(false);
      return;
    } finally {
      setSaving(false);
    }

    // Then reject
    onReject(registration.id);
    onOpenChange(false);
  };

  if (!registration) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-black text-white border-gray-800 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <User className="h-5 w-5" />
            Detalhes da Habilitação
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Registration Basic Information */}
          <div className="bg-black p-4 rounded-lg border border-gray-800">
            <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Informações da Habilitação
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-400">ID da Habilitação</label>
                <p className="text-white font-mono text-sm break-all">{registration.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Status</label>
                <div className="mt-1">
                  <Badge variant={getStatusVariant(registration.status)}>
                    {getStatusDisplay(registration.status)}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Solicitado em</label>
                <p className="text-white text-sm">
                  {new Date(registration.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-sm font-medium text-gray-400">Atualizado em</label>
                <p className="text-white text-sm">
                  {new Date(registration.updated_at).toLocaleString('pt-BR')}
                </p>
              </div>
              {registration.approved_by && (
                <div>
                  <label className="text-sm font-medium text-gray-400">Aprovado por</label>
                  <p className="text-white font-mono text-sm break-all">{registration.approved_by}</p>
                </div>
              )}
            </div>
          </div>

          {/* User Information */}
          {loading ? (
            <div className="bg-black p-4 rounded-lg border border-gray-800">
              <p className="text-gray-400">Carregando dados do usuário...</p>
            </div>
          ) : userProfile ? (
            <div className="bg-black p-4 rounded-lg border border-gray-800">
              <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
                <User className="h-4 w-4" />
                Dados do Usuário
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">Nome</label>
                  <p className="text-white">{userProfile.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Email
                  </label>
                  <p className="text-white">{userProfile.email}</p>
                </div>
                {userProfile.cpf && (
                  <div>
                    <label className="text-sm font-medium text-gray-400 flex items-center gap-1">
                      <IdCard className="h-3 w-3" />
                      CPF
                    </label>
                    <p className="text-white">{userProfile.cpf}</p>
                  </div>
                )}
                {userProfile.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-400 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      Telefone
                    </label>
                    <p className="text-white">{userProfile.phone}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-400">Tipo de Usuário</label>
                  <p className="text-white capitalize">{userProfile.role}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Cadastrado em</label>
                  <p className="text-white text-sm">
                    {new Date(userProfile.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-black p-4 rounded-lg border border-gray-800">
              <p className="text-gray-400">Não foi possível carregar os dados do usuário</p>
            </div>
          )}

          {/* Auction Information */}
          {auctionData && (
            <div className="bg-black p-4 rounded-lg border border-gray-800">
              <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Dados do Leilão
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">Nome do Leilão</label>
                  <p className="text-white font-medium">{auctionData.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Tipo</label>
                  <p className="text-white capitalize">{auctionData.auction_type}</p>
                </div>
                {auctionData.description && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-400">Descrição</label>
                    <p className="text-white">{auctionData.description}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-400">Status do Leilão</label>
                  <p className="text-white capitalize">{auctionData.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Criado em</label>
                  <p className="text-white text-sm">
                    {new Date(auctionData.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          )}

          <Separator className="border-gray-800" />

          {/* Notes Section */}
          <div className="bg-black p-4 rounded-lg border border-gray-800">
            <h3 className="font-semibold mb-4 text-white">Observações</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="internal-notes" className="text-white">
                  Observação Interna (não será enviada ao cliente)
                </Label>
                <Textarea
                  id="internal-notes"
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Digite observações internas sobre esta habilitação..."
                  className="mt-1 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="client-notes" className="text-white">
                  Observação para o Cliente (será enviada por email)
                </Label>
                <Textarea
                  id="client-notes"
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  placeholder="Digite observações que serão enviadas ao cliente por email..."
                  className="mt-1 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t border-gray-800">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-gray-600 text-white bg-black hover:bg-gray-900"
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
                        handleSaveNotesAndReject();
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
                        handleSaveNotesAndApprove();
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Aprovar
                    </Button>
                  )}
                </>
              )}

              {/* For non-pending statuses, show save button */}
              {registration.status !== 'pending' && (
                <Button
                  onClick={handleSaveNotes}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Save className="h-4 w-4 mr-1" />
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
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
