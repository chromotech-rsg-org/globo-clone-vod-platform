
import React from 'react';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface NotificationBadgeProps {
  count: number;
  onClick: () => void;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ count, onClick }) => {
  if (count === 0) return null;

  return (
    <div 
      className="relative cursor-pointer animate-pulse" 
      onClick={onClick}
    >
      <Bell className="h-6 w-6 text-white hover:text-yellow-400 transition-colors" />
      <Badge 
        variant="destructive" 
        className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs animate-bounce"
      >
        {count > 99 ? '99+' : count}
      </Badge>
    </div>
  );
};

export default NotificationBadge;
