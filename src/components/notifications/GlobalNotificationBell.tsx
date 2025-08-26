
import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useGlobalNotifications } from '@/hooks/useGlobalNotifications';
import { formatDateTime } from '@/utils/formatters';
import { CheckCircle, XCircle, MessageSquare } from 'lucide-react';

const GlobalNotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead } = useGlobalNotifications();
  const [showModal, setShowModal] = useState(false);

  const getStatusIcon = (status: string, type: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
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
      default:
        return status;
    }
  };

  const handleOpenModal = () => {
    setShowModal(true);
    markAsRead();
  };

  if (unreadCount === 0) return null;

  return (
    <>
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleOpenModal}
          className="relative p-2"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
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
                <Card key={notification.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(notification.status, notification.type)}
                        <div className="text-sm font-medium">
                          {getStatusText(notification.status, notification.type)}
                        </div>
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

export default GlobalNotificationBell;
