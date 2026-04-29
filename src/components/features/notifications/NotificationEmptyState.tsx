'use client';

import { BellOff } from 'lucide-react';

export function NotificationEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
      <BellOff size={24} />
      <h3 className="text-sm font-medium">No notifications</h3>
      <p className="text-xs">You&apos;re all caught up!</p>
    </div>
  );
}
