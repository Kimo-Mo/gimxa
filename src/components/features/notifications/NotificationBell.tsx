'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { NotificationPopover } from './NotificationPopover';
import { useNotificationsQuery } from '@/hooks/storefront/useNotificationsQuery';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);

  const { data } = useNotificationsQuery(true);
  const count = data?.filter((n) => !n.is_read).length ?? 0;


  return (
    <NotificationPopover isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button variant="secondary" size="icon" className="relative" aria-label="Notifications">
        <Bell size={18} />
        {count > 0 && (
          <Badge
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
            variant="default"
          >
            {count}
          </Badge>
        )}
      </Button>
    </NotificationPopover>
  );
}
