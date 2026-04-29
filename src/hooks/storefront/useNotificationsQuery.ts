import { useQuery } from '@tanstack/react-query';
import { notificationService } from '@/services/notification.service';
import { storefrontQueryKeys } from './queryKeys';
import type { Notification } from '@/types';

export function useNotificationsQuery(enabled: boolean) {
  return useQuery<Notification[]>({
    queryKey: storefrontQueryKeys.notifications(),
    queryFn: () => notificationService.getNotificationsList(),
    enabled,
  });
}
