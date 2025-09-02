
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
      className="p-3 cursor-pointer transition-all duration-300 ease-in-out hover:bg-muted/70 hover:border-primary/50 hover:shadow-lg hover:scale-[1.02] group" 
      onClick={() => onClick(item)}
    >
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div className="transition-all duration-200 group-hover:translate-x-1">
            <p className="font-medium group-hover:text-primary transition-colors duration-200">
              {item.auction_name}
            </p>
            <p className="text-sm text-muted-foreground group-hover:text-muted-foreground/80 transition-colors duration-200">
              por {item.user_name}
            </p>
          </div>
          <div className="text-right transition-all duration-200 group-hover:translate-x-[-2px]">
            {item.type === 'bid' ? (
              <p className="font-semibold text-slate-50 group-hover:text-primary transition-colors duration-200">
                {formatCurrency(item.value || 0)}
              </p>
            ) : (
              <Badge variant="outline" className="group-hover:border-primary/70 transition-colors duration-200">
                <Clock className="h-3 w-3 mr-1 group-hover:animate-pulse" />
                Pendente
              </Badge>
            )}
            <p className="text-xs text-muted-foreground group-hover:text-muted-foreground/80 transition-colors duration-200">
              {formatDate(item.created_at)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PendingNotificationItem;
