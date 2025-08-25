
import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePendingNotifications } from '@/hooks/usePendingNotifications';
import PendingNotificationModal from './PendingNotificationModal';

const NotificationBadge = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { pendingBids, pendingRegistrations, totalPending, loading, hasNewNotifications, refetch } = usePendingNotifications();

  if (loading || totalPending === 0) {
    return null;
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        className="relative"
      >
        <Bell className={`h-4 w-4 ${hasNewNotifications ? 'animate-bounce' : ''}`} />
        {totalPending > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {totalPending > 99 ? '99+' : totalPending}
          </Badge>
        )}
      </Button>

      <PendingNotificationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        pendingBids={pendingBids}
        pendingRegistrations={pendingRegistrations}
        onRefetch={refetch}
      />
    </>
  );
};

export default NotificationBadge;
