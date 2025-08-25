
import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePendingNotifications } from '@/hooks/usePendingNotifications';
import PendingNotificationModal from './PendingNotificationModal';

const NotificationBadge = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { pendingCount, loading } = usePendingNotifications();

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
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {pendingCount > 9 ? '9+' : pendingCount}
            </span>
          )}
        </Button>
      </div>

      <PendingNotificationModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default NotificationBadge;
