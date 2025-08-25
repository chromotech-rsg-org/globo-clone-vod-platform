
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
      className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => onClick(item)}
    >
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{item.auction_name}</p>
            <p className="text-sm text-muted-foreground">
              por {item.user_name}
            </p>
          </div>
          <div className="text-right">
            {item.type === 'bid' ? (
              <p className="font-semibold text-primary">
                {formatCurrency(item.value || 0)}
              </p>
            ) : (
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                Pendente
              </Badge>
            )}
            <p className="text-xs text-muted-foreground">
              {formatDate(item.created_at)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PendingNotificationItem;
