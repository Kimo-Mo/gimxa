import { useQuery } from '@tanstack/react-query';
import { adminQueryKeys } from './queryKeys';
import { notificationService } from '@/services/notification.service';
import type { AdminNotification } from '@/types/admin/notifications';

export function useAdminNotificationDetailQuery(id: string | number | null) {
  return useQuery({
    queryKey: adminQueryKeys.notification(id ?? ''),
    queryFn: () =>
      notificationService.adminNotificationDetail(String(id!)) as Promise<AdminNotification>,
    enabled: id !== null && id !== undefined && id !== '',
  });
}
