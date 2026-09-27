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
      <Button variant="secondary" size="icon" className="relative !h-8 !w-8 md:!h-9 md:!w-9 rounded-full" aria-label="Notifications">
        <Bell className="size-4 md:size-[18px]" />
        {count > 0 && (
          <Badge
            className="absolute -top-2 -right-2 h-4 w-4 md:h-5 md:w-5 flex items-center justify-center p-0 text-[9px] md:text-[10px]"
            variant="default"
          >
            {count}
          </Badge>
        )}
      </Button>
    </NotificationPopover>
  );
}
