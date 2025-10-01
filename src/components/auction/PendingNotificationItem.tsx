import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Clock, Gavel, Users, TrendingUp } from 'lucide-react';

interface PendingItem {
  id: string;
  type: 'bid' | 'registration' | 'limit_request';
  auction_name?: string;
  user_name: string;
  value?: number;
  created_at: string;
  isReactivationAfterManualDisable?: boolean;
  requested_limit?: number;
  current_limit?: number;
}

interface PendingNotificationItemProps {
  item: PendingItem;
  onClick: (item: PendingItem) => void;
}

const PendingNotificationItem: React.FC<PendingNotificationItemProps> = ({
  item,
  onClick
}) => {
  const getIcon = () => {
    if (item.type === 'bid') return <Gavel className="h-4 w-4 text-yellow-400" />;
    if (item.type === 'registration') return <Users className="h-4 w-4 text-blue-400" />;
    return <TrendingUp className="h-4 w-4 text-green-400" />;
  };

  const getTitle = () => {
    if (item.type === 'bid') return 'Lance';
    if (item.type === 'registration') return 'Habilitação';
    return 'Solicitação de Limite';
  };

  return (
    <Card 
      className="p-3 cursor-pointer transition-all duration-200 hover:bg-admin-primary/10 hover:border-admin-primary/50 border-admin-border" 
      onClick={() => onClick(item)}
    >
      <CardContent className="p-0">
        <div className="flex items-start gap-3">
          <div className="mt-1">{getIcon()}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-admin-modal-text">{getTitle()}</span>
              {item.auction_name && (
                <Badge variant="outline" className="text-xs border-admin-border text-admin-muted-foreground">
                  {item.auction_name}
                </Badge>
              )}
            </div>
            <p className="text-sm text-admin-muted-foreground truncate">{item.user_name}</p>
            {item.value && (
              <p className="text-sm font-semibold text-yellow-400 mt-1">
                {formatCurrency(item.value)}
              </p>
            )}
            {item.type === 'limit_request' && item.requested_limit && (
              <p className="text-sm font-semibold text-green-400 mt-1">
                {formatCurrency(item.current_limit || 0)} → {formatCurrency(item.requested_limit)}
              </p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-admin-muted-foreground whitespace-nowrap">
              {formatDate(item.created_at)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PendingNotificationItem;
