import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { adminQueryKeys } from './queryKeys';
import { notificationService } from '@/services/notification.service';
import type { AdminNotificationListParams, AdminNotification } from '@/types/admin/notifications';

interface PaginatedNotificationsResult {
  results: AdminNotification[];
  count: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
}

export interface NotificationQueryParams extends AdminNotificationListParams {
  is_read?: boolean;
  is_emailed?: boolean;
}

function buildBackendParams(params: NotificationQueryParams): Record<string, unknown> {
  const { search, is_read, is_emailed, page, page_size } = params;

  const filterParts: string[] = [];
  if (is_read !== undefined) filterParts.push(`is_read=${is_read}`);
  if (is_emailed !== undefined) filterParts.push(`is_emailed=${is_emailed}`);

  return {
    ...(search ? { search } : {}),
    ...(filterParts.length > 0 ? { filter: filterParts.join(',') } : {}),
    ...(page !== undefined ? { page } : {}),
    ...(page_size !== undefined ? { page_size } : {}),
  };
}

export function useAdminNotificationsQuery(params: NotificationQueryParams) {
  return useQuery<PaginatedNotificationsResult>({
    queryKey: adminQueryKeys.notifications(params),
    queryFn: async () => {
      const backendParams = buildBackendParams(params);
      const data = await notificationService.adminNotificationsList(
        backendParams as AdminNotificationListParams
      );

      return data as PaginatedNotificationsResult;
    },
    placeholderData: keepPreviousData,
  });
}
