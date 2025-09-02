
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Clock } from 'lucide-react';

interface PendingItem {
  id: string;
  type: 'bid' | 'registration';
  auction_name: string;
  user_name: string;
  value?: number;
  created_at: string;
}

interface PendingNotificationItemProps {
  item: PendingItem;
  onClick: (item: PendingItem) => void;
}

const PendingNotificationItem: React.FC<PendingNotificationItemProps> = ({
  item,
  onClick
}) => {
  return (
    <Card 
      className="p-3 cursor-pointer transition-all duration-200 hover:bg-admin-primary/10 hover:border-admin-primary/50 border-admin-border" 
      onClick={() => onClick(item)}
    >
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-admin-modal-text truncate">
              {item.auction_name}
            </p>
            <p className="text-sm text-admin-muted-foreground truncate">
              por {item.user_name}
            </p>
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            {item.type === 'bid' ? (
              <p className="font-semibold text-admin-modal-text">
                {formatCurrency(item.value || 0)}
              </p>
            ) : (
              <Badge variant="outline" className="border-admin-border text-admin-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                Pendente
              </Badge>
            )}
            <p className="text-xs text-admin-muted-foreground">
              {formatDate(item.created_at)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PendingNotificationItem;
