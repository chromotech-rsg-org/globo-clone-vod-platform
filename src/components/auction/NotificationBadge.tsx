
import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NotificationBadgeProps {
  count: number;
  onClick: () => void;
}

const NotificationBadge = ({ count, onClick }: NotificationBadgeProps) => {
  if (count === 0) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="relative p-2 hover:bg-admin-muted"
    >
      <Bell className="h-5 w-5 text-white" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Button>
  );
};

export default NotificationBadge;
