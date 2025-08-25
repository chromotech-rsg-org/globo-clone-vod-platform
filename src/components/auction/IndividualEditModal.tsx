
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/utils/formatters';

interface PendingItem {
  id: string;
  type: 'bid' | 'registration';
  auction_name: string;
  user_name: string;
  value?: number;
  created_at: string;
}

interface IndividualEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PendingItem | null;
  onSaved: () => void;
}

const IndividualEditModal = ({ isOpen, onClose, item, onSaved }: IndividualEditModalProps) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'approved' | 'rejected'>('approved');
  const [internalNotes, setInternalNotes] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (item && isOpen) {
      fetchItemDetails();
    }
  }, [item, isOpen]);

  const fetchItemDetails = async () => {
    if (!item) return;

    try {
      const table = item.type === 'bid' ? 'bids' : 'auction_registrations';
      const { data: itemData, error: itemError } = await supabase
        .from(table)
        .select('*')
        .eq('id', item.id)
        .single();

      if (itemError) throw itemError;

      // Fetch user data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', itemData.user_id)
        .single();

      if (!profileError && profileData) {
        setUserData(profileData);
      }

      setInternalNotes(itemData.internal_notes || '');
      setClientNotes(itemData.client_notes || '');
    } catch (error) {
      console.error('Error fetching item details:', error);
    }
  };

  const handleSave = async () => {
    if (!item) return;

    setLoading(true);
    try {
      const table = item.type === 'bid' ? 'bids' : 'auction_registrations';
      const { error } = await supabase
        .from(table)
        .update({
          status,
          internal_notes: internalNotes,
          client_notes: clientNotes,
          approved_by: status === 'approved' ? (await supabase.auth.getUser()).data.user?.id : null
        })
        .eq('id', item.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `${item.type === 'bid' ? 'Lance' : 'Habilitação'} ${status === 'approved' ? 'aprovado' : 'rejeitado'} com sucesso`,
      });

      onSaved();
      onClose();
    } catch (error: any) {
      console.error('Error updating item:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar item",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Editar {item.type === 'bid' ? 'Lance' : 'Habilitação'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Leilão:</label>
              <p className="text-sm text-muted-foreground">{item.auction_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Usuário:</label>
              <p className="text-sm text-muted-foreground">{item.user_name}</p>
            </div>
          </div>

          {item.type === 'bid' && item.value && (
            <div>
              <label className="text-sm font-medium">Valor do Lance:</label>
              <p className="text-sm text-muted-foreground">{formatCurrency(item.value)}</p>
            </div>
          )}

          {userData && (
            <div className="space-y-2">
              <Separator />
              <h4 className="font-medium">Dados do Usuário</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="font-medium">Nome:</label>
                  <p className="text-muted-foreground">{userData.name}</p>
                </div>
                <div>
                  <label className="font-medium">Email:</label>
                  <p className="text-muted-foreground">{userData.email}</p>
                </div>
                {userData.cpf && (
                  <div>
                    <label className="font-medium">CPF:</label>
                    <p className="text-muted-foreground">{userData.cpf}</p>
                  </div>
                )}
                {userData.phone && (
                  <div>
                    <label className="font-medium">Telefone:</label>
                    <p className="text-muted-foreground">{userData.phone}</p>
                  </div>
                )}
              </div>
              <Separator />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Status:</label>
            <div className="flex gap-2">
              <Button
                variant={status === 'approved' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatus('approved')}
              >
                Aprovar
              </Button>
              <Button
                variant={status === 'rejected' ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => setStatus('rejected')}
              >
                Rejeitar
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notas Internas:</label>
            <Textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Notas para uso interno..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notas para o Cliente:</label>
            <Textarea
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
              placeholder="Mensagem que será enviada ao cliente..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IndividualEditModal;
