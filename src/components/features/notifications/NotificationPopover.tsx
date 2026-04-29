'use client';

import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger, Badge } from '@/components/ui';
import { useNotificationsQuery } from '@/hooks/storefront/useNotificationsQuery';
import {
  useDeleteNotificationMutation,
  useClearAllNotificationsMutation,
} from '@/hooks/storefront/useNotificationMutations';
import { NotificationList } from './NotificationList';
import { NotificationPopoverFooter } from './NotificationPopoverFooter';
import { NotificationDetailModal } from './NotificationDetailModal';
import { useQueryClient } from '@tanstack/react-query';
import { storefrontQueryKeys } from '@/hooks/storefront/queryKeys';
import type { Notification } from '@/types';

interface NotificationPopoverProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function NotificationPopover({ isOpen, onOpenChange, children }: NotificationPopoverProps) {
  const { data, isPending, isError } = useNotificationsQuery(isOpen);
  const { mutate: deleteNotification, variables: deletingId } = useDeleteNotificationMutation();
  const { mutate: clearAll, isPending: isClearingAll } = useClearAllNotificationsMutation();
  const queryClient = useQueryClient();
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | number | null>(
    null
  );
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const notifications = data ?? [];
  const count = notifications.filter((n) => !n.is_read).length;

  const handleSelect = async (id: string | number) => {
    setSelectedNotificationId(id);
    setIsDetailOpen(true);

    // Optimistically update the list cache
    queryClient.setQueryData<Notification[]>(storefrontQueryKeys.notifications(), (oldData) => {
      if (!oldData) return oldData;
      return oldData.map((n) => (n.id === id ? { ...n, is_read: true } : n));
    });
  };

  return (
    <>
      <Popover open={isOpen} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent className="w-[calc(100vw-2rem)] sm:w-80 p-0" align="end" sideOffset={8}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold">Notifications</p>
            <Badge variant="secondary">Unread: {count}</Badge>
          </div>

          {isPending ? (
            <div>
              <div className="h-14 bg-muted animate-pulse rounded m-2" />
              <div className="h-14 bg-muted animate-pulse rounded m-2" />
              <div className="h-14 bg-muted animate-pulse rounded m-2" />
            </div>
          ) : isError ? (
            <div className="p-4 text-center text-sm text-destructive">
              Failed to load notifications.
            </div>
          ) : (
            <NotificationList
              notifications={notifications}
              onSelect={handleSelect}
              deletingId={(deletingId ?? null) as string | number | null}
              onDelete={(id) => deleteNotification(id)}
            />
          )}

          <NotificationPopoverFooter
            onClearAll={() => clearAll()}
            isClearingAll={isClearingAll}
          />
        </PopoverContent>
      </Popover>

      <NotificationDetailModal
        notificationId={selectedNotificationId}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </>
  );
}
