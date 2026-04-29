'use client';

import { NotificationItem } from './NotificationItem';
import { NotificationEmptyState } from './NotificationEmptyState';
import type { Notification as UserNotification } from '@/types';

interface NotificationListProps {
  notifications: UserNotification[];
  onSelect: (id: string | number) => void;
  deletingId: string | number | null;
  onDelete: (id: string | number) => void;
}

export function NotificationList({ notifications, onSelect, deletingId, onDelete }: NotificationListProps) {
  if (notifications.length === 0) {
    return <NotificationEmptyState />;
  }

  return (
    <div className="max-h-80 overflow-y-auto">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onSelect={onSelect}
          onDelete={onDelete}
          isDeleting={deletingId === notification.id}
        />
      ))}
    </div>
  );
}
