
import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePendingNotifications } from '@/hooks/usePendingNotifications';
import PendingNotificationModal from './PendingNotificationModal';

const NotificationBadge = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { totalPending, loading, pendingBids, pendingRegistrations } = usePendingNotifications();

  if (loading) return null;

  return (
    <>
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="relative p-2"
        >
          <Bell className="h-5 w-5 text-white" />
          {totalPending > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {totalPending > 9 ? '9+' : totalPending}
            </span>
          )}
        </Button>
      </div>

      <PendingNotificationModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        pendingBids={pendingBids}
        pendingRegistrations={pendingRegistrations}
      />
    </>
  );
};

export default NotificationBadge;
