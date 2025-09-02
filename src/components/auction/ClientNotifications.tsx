
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Bell, Clock, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { formatDateTime } from '@/utils/formatters';
import { useToast } from '@/components/ui/use-toast';
import NotificationBadge from './NotificationBadge';

interface ClientNotification {
  id: string;
  type: 'bid' | 'registration';
  auction_name: string;
  status: string;
  client_notes?: string;
  created_at: string;
  updated_at: string;
  read: boolean;
}

interface ClientNotificationsProps {
  auctionId?: string;
}

const ClientNotifications: React.FC<ClientNotificationsProps> = ({ auctionId }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      // Buscar lances do usuário
      const { data: bidsData, error: bidsError } = await supabase
        .from('bids')
        .select(`
          id, status, client_notes, created_at, updated_at,
          auctions!inner(name)
        `)
        .eq('user_id', user.id)
        .not('client_notes', 'is', null)
        .neq('client_notes', '')
        .eq(auctionId ? 'auction_id' : 'user_id', auctionId || user.id)
        .order('updated_at', { ascending: false });

      // Buscar habilitações do usuário
      const { data: registrationsData, error: registrationsError } = await supabase
        .from('auction_registrations')
        .select(`
          id, status, client_notes, created_at, updated_at,
          auctions!inner(name)
        `)
        .eq('user_id', user.id)
        .not('client_notes', 'is', null)
        .neq('client_notes', '')
        .eq(auctionId ? 'auction_id' : 'user_id', auctionId || user.id)
        .order('updated_at', { ascending: false });

      if (bidsError) throw bidsError;
      if (registrationsError) throw registrationsError;

      const formattedBids = (bidsData || []).map(bid => ({
        id: bid.id,
        type: 'bid' as const,
        auction_name: bid.auctions?.name || 'Leilão',
        status: bid.status,
        client_notes: bid.client_notes,
        created_at: bid.created_at,
        updated_at: bid.updated_at,
        read: false // TODO: Implementar sistema de leitura
      }));

      const formattedRegistrations = (registrationsData || []).map(reg => ({
        id: reg.id,
        type: 'registration' as const,
        auction_name: reg.auctions?.name || 'Leilão',
        status: reg.status,
        client_notes: reg.client_notes,
        created_at: reg.created_at,
        updated_at: reg.updated_at,
        read: false // TODO: Implementar sistema de leitura
      }));

      const allNotifications = [...formattedBids, ...formattedRegistrations]
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

      setNotifications(allNotifications);
      setUnreadCount(allNotifications.filter(n => !n.read).length);

    } catch (error) {
      console.error('Error fetching client notifications:', error);
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    // Real-time updates
    const channel = supabase
      .channel(`client-notifications-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'bids',
        filter: `user_id=eq.${user.id}`
      }, fetchNotifications)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'auction_registrations',
        filter: `user_id=eq.${user.id}`
      }, fetchNotifications)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, auctionId]);

  // Show modal when there are new notifications
  useEffect(() => {
    if (unreadCount > 0 && notifications.length > 0) {
      // Show toast for new notifications
      const lastNotification = notifications[0];
      if (lastNotification && !lastNotification.read) {
        toast({
          title: "Nova notificação",
          description: `Você tem uma atualização sobre ${lastNotification.type === 'bid' ? 'seu lance' : 'sua habilitação'} no ${lastNotification.auction_name}`,
          action: (
            <Button size="sm" onClick={() => setShowModal(true)}>
              Ver
            </Button>
          ),
        });
      }
    }
  }, [unreadCount, notifications, toast]);

  const getStatusIcon = (status: string, type: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string, type: string) => {
    const prefix = type === 'bid' ? 'Lance' : 'Habilitação';
    switch (status) {
      case 'approved':
        return `${prefix} Aprovado`;
      case 'rejected':
        return `${prefix} Rejeitado`;
      case 'pending':
        return `${prefix} Pendente`;
      default:
        return status;
    }
  };

  if (!user) return null;

  return (
    <>
      <div className="fixed top-4 right-4 z-50">
        <NotificationBadge 
          count={unreadCount} 
          onClick={() => setShowModal(true)} 
        />
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Suas Notificações ({notifications.length})
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma notificação encontrada
              </div>
            ) : (
              notifications.map((notification) => (
                <Card key={notification.id} className={`${!notification.read ? 'border-primary' : ''}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(notification.status, notification.type)}
                        <CardTitle className="text-sm">
                          {getStatusText(notification.status, notification.type)}
                        </CardTitle>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDateTime(notification.updated_at)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">
                        {notification.auction_name}
                      </div>
                      {notification.client_notes && (
                        <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="h-4 w-4 mt-0.5 text-primary" />
                            <div>
                              <div className="font-medium text-foreground mb-1">Mensagem:</div>
                              {notification.client_notes}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setShowModal(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ClientNotifications;
