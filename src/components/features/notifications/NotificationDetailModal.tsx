'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui';
import { useNotificationDetailQuery } from '@/hooks/storefront/useNotificationDetailQuery';

interface NotificationDetailModalProps {
  notificationId: string | number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDetailModal({ notificationId, isOpen, onClose }: NotificationDetailModalProps) {
  const { data: notification, isPending, isError } = useNotificationDetailQuery(
    notificationId,
    isOpen && notificationId !== null
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{notification?.subject ?? 'Notification'}</DialogTitle>
        </DialogHeader>

        <div>
          {isPending ? (
            <div className="space-y-2">
              <div className="animate-pulse bg-muted rounded h-4 w-full" />
              <div className="animate-pulse bg-muted rounded h-4 w-3/4" />
            </div>
          ) : isError ? (
            <p className="text-sm text-destructive">
              Failed to load notification. Please close and try again.
            </p>
          ) : (
            <>
              <p className="text-sm whitespace-pre-wrap">{notification?.message}</p>
              <p className="text-xs text-muted-foreground mt-3">
                {notification?.created_at
                  ? new Date(notification.created_at).toLocaleString()
                  : ''}
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
