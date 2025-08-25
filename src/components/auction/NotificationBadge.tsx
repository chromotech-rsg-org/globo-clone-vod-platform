
import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePendingNotifications } from '@/hooks/usePendingNotifications';
import PendingNotificationModal from './PendingNotificationModal';

interface NotificationBadgeProps {
  count?: number;
  onClick?: () => void;
}

const NotificationBadge = ({ count, onClick }: NotificationBadgeProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { pendingBids, pendingRegistrations, totalPending, loading, hasNewNotifications, refetch } = usePendingNotifications();

  const displayCount = count !== undefined ? count : totalPending;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setIsModalOpen(true);
    }
  };

  if (loading || displayCount === 0) {
    return null;
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className="relative"
      >
        <Bell className={`h-4 w-4 ${hasNewNotifications ? 'animate-bounce' : ''}`} />
        {displayCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {displayCount > 99 ? '99+' : displayCount}
          </Badge>
        )}
      </Button>

      {!onClick && (
        <PendingNotificationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          pendingBids={pendingBids}
          pendingRegistrations={pendingRegistrations}
          onRefetch={refetch}
        />
      )}
    </>
  );
};

export default NotificationBadge;
