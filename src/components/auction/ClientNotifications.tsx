import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Bell, Clock, CheckCircle, XCircle, MessageSquare, Check, MailCheck } from 'lucide-react';
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
  read_at?: string;
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

      // Buscar notificações lidas
      const { data: readNotifications, error: readError } = await supabase
        .from('user_notification_reads')
        .select('notification_type, notification_id, read_at')
        .eq('user_id', user.id);

      if (bidsError) throw bidsError;
      if (registrationsError) throw registrationsError;
      if (readError) throw readError;

      const readMap = new Map();
      (readNotifications || []).forEach(read => {
        readMap.set(`${read.notification_type}-${read.notification_id}`, read.read_at);
      });

      const formattedBids = (bidsData || []).map(bid => ({
        id: bid.id,
        type: 'bid' as const,
        auction_name: bid.auctions?.name || 'Leilão',
        status: bid.status,
        client_notes: bid.client_notes,
        created_at: bid.created_at,
        updated_at: bid.updated_at,
        read: readMap.has(`bid-${bid.id}`),
        read_at: readMap.get(`bid-${bid.id}`)
      }));

      const formattedRegistrations = (registrationsData || []).map(reg => ({
        id: reg.id,
        type: 'registration' as const,
        auction_name: reg.auctions?.name || 'Leilão',
        status: reg.status,
        client_notes: reg.client_notes,
        created_at: reg.created_at,
        updated_at: reg.updated_at,
        read: readMap.has(`registration-${reg.id}`),
        read_at: readMap.get(`registration-${reg.id}`)
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

  const markAsRead = async (notificationId: string, notificationType: 'bid' | 'registration') => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_notification_reads')
        .insert({
          user_id: user.id,
          notification_type: notificationType,
          notification_id: notificationId
        });

      if (error && error.code !== '23505') { // Ignore unique constraint violations
        throw error;
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId && notif.type === notificationType
            ? { ...notif, read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));

      toast({
        title: "Mensagem marcada como lida",
        description: "A notificação foi marcada como lida com sucesso.",
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: "Erro",
        description: "Erro ao marcar mensagem como lida",
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      
      for (const notification of unreadNotifications) {
        await supabase
          .from('user_notification_reads')
          .insert({
            user_id: user.id,
            notification_type: notification.type,
            notification_id: notification.id
          });
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true, read_at: new Date().toISOString() }))
      );
      
      setUnreadCount(0);

      toast({
        title: "Todas as mensagens marcadas como lidas",
        description: "Todas as notificações foram marcadas como lidas.",
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: "Erro",
        description: "Erro ao marcar todas as mensagens como lidas",
        variant: "destructive",
      });
    }
  };

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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-black border-green-600/30 text-white [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-900 [&::-webkit-scrollbar-thumb]:bg-green-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-green-500">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-green-400">
                <Bell className="h-5 w-5" />
                Suas Notificações ({notifications.length})
                {unreadCount > 0 && (
                  <Badge className="bg-red-600 text-white">
                    {unreadCount} não lidas
                  </Badge>
                )}
              </DialogTitle>
              {unreadCount > 0 && (
                <Button
                  size="sm"
                  onClick={markAllAsRead}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <MailCheck className="h-4 w-4 mr-1" />
                  Marcar todas como lidas
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                Nenhuma notificação encontrada
              </div>
            ) : (
              notifications.map((notification) => (
                <Card key={notification.id} className={`transition-all ${
                  notification.read 
                    ? 'bg-gray-900/50 border-gray-700 opacity-80' 
                    : 'bg-gray-900 border-green-600/50 shadow-green-600/20 shadow-sm'
                }`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {notification.read && <MailCheck className="h-4 w-4 text-green-500" />}
                        {getStatusIcon(notification.status, notification.type)}
                        <CardTitle className={`text-sm ${notification.read ? 'text-gray-400' : 'text-white'}`}>
                          {getStatusText(notification.status, notification.type)}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-gray-400">
                          {formatDateTime(notification.updated_at)}
                        </div>
                        {!notification.read && (
                          <Button
                            size="sm"
                            onClick={() => markAsRead(notification.id, notification.type)}
                            className="h-6 px-2 bg-green-600 hover:bg-green-700 text-white text-xs"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Marcar como lida
                          </Button>
                        )}
                      </div>
                    </div>
                    {notification.read && notification.read_at && (
                      <div className="text-xs text-green-500 mt-1">
                        Lida em: {formatDateTime(notification.read_at)}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className={`text-sm font-medium ${notification.read ? 'text-gray-500' : 'text-green-400'}`}>
                        {notification.auction_name}
                      </div>
                      {notification.client_notes && (
                        <div className={`text-sm bg-gray-800 p-3 rounded border ${
                          notification.read 
                            ? 'text-gray-400 border-gray-700' 
                            : 'text-gray-300 border-green-600/30'
                        }`}>
                          <div className="flex items-start gap-2">
                            <MessageSquare className={`h-4 w-4 mt-0.5 ${notification.read ? 'text-gray-500' : 'text-green-400'}`} />
                            <div>
                              <div className={`font-medium mb-1 ${notification.read ? 'text-gray-500' : 'text-green-400'}`}>Mensagem:</div>
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

          <div className="flex justify-end pt-4 border-t border-green-600/30">
            <Button 
              onClick={() => setShowModal(false)}
              className="bg-green-600 hover:bg-green-700 text-white border-green-600"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ClientNotifications;
