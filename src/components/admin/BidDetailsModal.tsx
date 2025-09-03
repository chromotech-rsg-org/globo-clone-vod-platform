import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Check, X, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

interface UserProfile {
  id: string;
  name: string;
  email: string;
  cpf: string | null;
  phone: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

interface Auction {
  id: string;
  name: string;
  description?: string;
  auction_type: string;
  status: string;
  created_at: string;
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
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [auction, setAuction] = useState<Auction | null>(null);
  const [internalNotes, setInternalNotes] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (bid && open) {
      fetchBidDetails();
      setInternalNotes(bid.internal_notes || '');
      setClientNotes(bid.client_notes || '');
    }
  }, [bid, open]);

  const fetchBidDetails = async () => {
    if (!bid) return;
    
    setLoading(true);
    try {
      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', bid.user_id)
        .single();
      
      setUserProfile(profile);

      // Fetch auction details
      const { data: auctionData } = await supabase
        .from('auctions')
        .select('*')
        .eq('id', bid.auction_id)
        .single();
      
      setAuction(auctionData);
    } catch (error) {
      console.error('Error fetching bid details:', error);
      toast({
        title: "Erro",
        description: "Erro ao buscar detalhes do lance",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!bid) return;
    
    setLoading(true);
    try {
      // Update bid with notes
      const { error } = await supabase
        .from('bids')
        .update({
          internal_notes: internalNotes,
          client_notes: clientNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', bid.id);

      if (error) throw error;

      // Send notification to client if there are client notes
      if (clientNotes.trim() && userProfile) {
        await supabase.functions.invoke('send-registration-notification', {
          body: {
            type: 'bid_update',
            userEmail: userProfile.email,
            userName: userProfile.name,
            auctionName: auction?.name || 'Leilão',
            clientNotes: clientNotes,
            bidValue: bid.bid_value,
            status: bid.status
          }
        });
      }

      toast({
        title: "Sucesso",
        description: "Observações salvas com sucesso",
      });
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar observações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!bid) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-black text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">
            Detalhes do Lance
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-track-black scrollbar-thumb-gray-700 hover:scrollbar-thumb-gray-600">
          {/* Lance Information */}
          <Card className="p-4 bg-black border-gray-800 overflow-y-auto scrollbar-thin scrollbar-track-black scrollbar-thumb-gray-700 hover:scrollbar-thumb-gray-600">
            <h3 className="text-lg font-semibold text-white mb-4">Informações do Lance</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300">ID do Lance</label>
                <p className="text-white font-mono text-sm">{bid.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300">Status</label>
                <div className="mt-1">
                  <Badge variant={getStatusVariant(bid.status)}>
                    {getStatusDisplay(bid.status)}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300">Valor do Lance</label>
                <p className="text-2xl font-bold text-white">
                  R$ {bid.bid_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300">Criado em</label>
                <p className="text-white">
                  {new Date(bid.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
            
            {bid.is_winner && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mt-4">
                <p className="text-green-400 font-semibold">🏆 Lance Vencedor</p>
              </div>
            )}
          </Card>

          {/* User Information */}
          <Card className="p-4 bg-black border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">Dados do Usuário</h3>
            {loading ? (
              <p className="text-gray-400">Carregando...</p>
            ) : userProfile ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300">Nome</label>
                  <p className="text-white">{userProfile.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">Email</label>
                  <p className="text-white">{userProfile.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">CPF</label>
                  <p className="text-white">{userProfile.cpf || 'Não informado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">Telefone</label>
                  <p className="text-white">{userProfile.phone || 'Não informado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">Função</label>
                  <p className="text-white">{userProfile.role}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">Cadastro</label>
                  <p className="text-white">
                    {new Date(userProfile.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">Dados do usuário não encontrados</p>
            )}
          </Card>

          {/* Auction Information */}
          <Card className="p-4 bg-black border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">Dados do Leilão</h3>
            {loading ? (
              <p className="text-gray-400">Carregando...</p>
            ) : auction ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300">Nome</label>
                  <p className="text-white">{auction.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">Tipo</label>
                  <p className="text-white">{auction.auction_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">Status</label>
                  <p className="text-white">{auction.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">Criado em</label>
                  <p className="text-white">
                    {new Date(auction.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                {auction.description && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-300">Descrição</label>
                    <p className="text-white">{auction.description}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-400">Dados do leilão não encontrados</p>
            )}
          </Card>

          {/* Notes Section */}
          <Card className="p-4 bg-black border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">Observações</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Observação Interna
                </label>
                <Textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Observações internas (não visíveis para o cliente)..."
                  className="bg-black border-gray-700 text-white placeholder:text-gray-400"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Observação para o Cliente
                </label>
                <Textarea
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  placeholder="Observações que serão enviadas para o cliente..."
                  className="bg-black border-gray-700 text-white placeholder:text-gray-400"
                  rows={3}
                />
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="border-gray-600 text-black bg-white hover:bg-gray-100"
              >
                Fechar
              </Button>
              
              <Button
                onClick={handleSaveNotes}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="h-4 w-4 mr-1" />
                Salvar Observações
              </Button>
            </div>
            
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
                    disabled={loading}
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
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={loading}
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
