'use client';

import { Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';
import type { Notification as UserNotification } from '@/types';

interface NotificationItemProps {
  notification: UserNotification;
  onDelete: (id: string | number) => void;
  onSelect: (id: string | number) => void;
  isDeleting: boolean;
}

export function NotificationItem({ notification, onDelete, onSelect, isDeleting }: NotificationItemProps) {
  const formattedTime = new Date(notification.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      onClick={() => onSelect(notification.id)}
      className={`flex items-start gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors border-b border-border last:border-0 relative`}
    >
      {!notification.is_read && (
        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary" />
      )}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${!notification.is_read ? 'text-primary' : ''}`}>
          {notification.subject || '(No subject)'}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
          {notification.message}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          {formattedTime}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        disabled={isDeleting}
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notification.id);
        }}
        aria-label={`Delete notification ${notification.id}`}
      >
        {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
      </Button>
    </div>
  );
}
