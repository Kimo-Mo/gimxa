import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/notification.service';
import { useCacheClear } from '@/hooks/admin/useCacheClear';
import { toast } from 'sonner';

export function useDeleteNotificationMutation() {
  const queryClient = useQueryClient();
  const cacheClear = useCacheClear();

  return useMutation({
    mutationFn: (id: string | number) => notificationService.deleteNotification(String(id)),
    onSuccess: async () => {
      await cacheClear();
      await queryClient.invalidateQueries({ queryKey: ['storefront', 'notifications'] });
      toast.success('Notification deleted.');
    },
    onError: () => {
      toast.error('Failed to delete notification.');
    },
  });
}

export function useClearAllNotificationsMutation() {
  const queryClient = useQueryClient();
  const cacheClear = useCacheClear();

  return useMutation({
    mutationFn: () => notificationService.deleteAllMyNotifications(),
    onSuccess: async () => {
      await cacheClear();
      await queryClient.invalidateQueries({ queryKey: ['storefront', 'notifications'] });
      toast.success('All notifications cleared.');
    },
    onError: () => {
      toast.error('Failed to clear notifications.');
    },
  });
}
