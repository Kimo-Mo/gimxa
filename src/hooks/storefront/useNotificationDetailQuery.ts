import { useQuery } from '@tanstack/react-query';
import { notificationService } from '@/services/notification.service';
import { storefrontQueryKeys } from './queryKeys';
import type { Notification } from '@/types';

export function useNotificationDetailQuery(id: string | number | null, enabled: boolean) {
  return useQuery<Notification>({
    queryKey: storefrontQueryKeys.notification(id!),
    queryFn: () => notificationService.getNotificationDetail(String(id!)),
    enabled: enabled && id !== null,
  });
}
