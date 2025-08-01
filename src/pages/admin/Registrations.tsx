import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AuctionRegistration } from '@/types/auction';
import { Check, X, Eye, Clock, AlertCircle } from 'lucide-react';
import { formatDateTime } from '@/utils/formatters';

interface RegistrationWithDetails extends AuctionRegistration {
  auction_name?: string;
  user_name?: string;
  user_email?: string;
}

const Registrations = () => {
  const [registrations, setRegistrations] = useState<RegistrationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegistration, setSelectedRegistration] = useState<RegistrationWithDetails | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [internalNotes, setInternalNotes] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [nextRegistrationMinutes, setNextRegistrationMinutes] = useState('');
  const { toast } = useToast();

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('auction_registrations')
        .select(`
          *,
          auctions!inner(name),
          profiles!auction_registrations_user_id_fkey(name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = data.map(item => ({
        ...item,
        auction_name: item.auctions?.name,
        user_name: item.profiles?.name,
        user_email: item.profiles?.email
      })) as RegistrationWithDetails[];

      setRegistrations(formattedData);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as habilitações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (registrationId: string, status: 'approved' | 'rejected') => {
    try {
      const updateData: any = {
        status,
        internal_notes: internalNotes,
        client_notes: clientNotes
      };

      if (status === 'rejected' && nextRegistrationMinutes) {
        const nextAllowedAt = new Date();
        nextAllowedAt.setMinutes(nextAllowedAt.getMinutes() + parseInt(nextRegistrationMinutes));
        updateData.next_registration_allowed_at = nextAllowedAt.toISOString();
      }

      const { error } = await supabase
        .from('auction_registrations')
        .update(updateData)
        .eq('id', registrationId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Habilitação ${status === 'approved' ? 'aprovada' : 'rejeitada'} com sucesso`,
      });

      setDialogOpen(false);
      setSelectedRegistration(null);
      setInternalNotes('');
      setClientNotes('');
      setNextRegistrationMinutes('');
      fetchRegistrations();
    } catch (error) {
      console.error('Error updating registration:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a habilitação",
        variant: "destructive"
      });
    }
  };

  const openDialog = (registration: RegistrationWithDetails) => {
    setSelectedRegistration(registration);
    setInternalNotes(registration.internal_notes || '');
    setClientNotes(registration.client_notes || '');
    setNextRegistrationMinutes('');
    setDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500 text-white"><Check className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Rejeitado</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredRegistrations = registrations.filter(reg => {
    if (statusFilter === 'all') return true;
    return reg.status === statusFilter;
  });

  useEffect(() => {
    fetchRegistrations();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Habilitações</h1>
          <p className="text-muted-foreground">Gerencie as solicitações de habilitação para leilões</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Lista de Habilitações</CardTitle>
              <CardDescription>
                {filteredRegistrations.length} habilitação(ões) encontrada(s)
              </CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Leilão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRegistrations.map((registration) => (
                <TableRow key={registration.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{registration.user_name}</div>
                      <div className="text-sm text-muted-foreground">{registration.user_email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{registration.auction_name}</TableCell>
                  <TableCell>{getStatusBadge(registration.status)}</TableCell>
                  <TableCell>{formatDateTime(registration.created_at)}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDialog(registration)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Gerenciar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Habilitação</DialogTitle>
            <DialogDescription>
              Aprove ou rejeite a solicitação de habilitação
            </DialogDescription>
          </DialogHeader>
          
          {selectedRegistration && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Usuário</Label>
                  <p className="text-sm">{selectedRegistration.user_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedRegistration.user_email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Leilão</Label>
                  <p className="text-sm">{selectedRegistration.auction_name}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Status Atual</Label>
                <div className="mt-1">
                  {getStatusBadge(selectedRegistration.status)}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="internal-notes">Observações Internas</Label>
                  <Textarea
                    id="internal-notes"
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Notas para uso interno..."
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="client-notes">Observações para o Cliente</Label>
                  <Textarea
                    id="client-notes"
                    value={clientNotes}
                    onChange={(e) => setClientNotes(e.target.value)}
                    placeholder="Mensagem que será enviada ao cliente..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="next-registration">Próxima Habilitação (minutos) - Apenas para rejeição</Label>
                  <Input
                    id="next-registration"
                    type="number"
                    value={nextRegistrationMinutes}
                    onChange={(e) => setNextRegistrationMinutes(e.target.value)}
                    placeholder="Ex: 1440 (24 horas)"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="space-x-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            {selectedRegistration?.status === 'pending' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => handleStatusUpdate(selectedRegistration.id, 'rejected')}
                >
                  <X className="h-4 w-4 mr-2" />
                  Rejeitar
                </Button>
                <Button
                  onClick={() => handleStatusUpdate(selectedRegistration.id, 'approved')}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Aprovar
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Registrations;