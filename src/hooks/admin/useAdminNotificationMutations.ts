import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/notification.service';
import { useCacheClear } from './useCacheClear';
import { toast } from 'sonner';
import type { AdminSendNotificationPayload } from '@/types/admin/notifications';

export function useSendNotificationMutation() {
  const queryClient = useQueryClient();
  const cacheClear = useCacheClear();

  return useMutation({
    mutationFn: (payload: AdminSendNotificationPayload) =>
      notificationService.adminSendNotification(payload as Parameters<typeof notificationService.adminSendNotification>[0]),
    onSuccess: async () => {
      await cacheClear();
      await queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
      toast.success('Notification sent successfully.');
    },
    onError: () => {
      toast.error('Failed to send notification. Please try again.');
    },
  });
}

export function useDeleteNotificationMutation() {
  const queryClient = useQueryClient();
  const cacheClear = useCacheClear();

  return useMutation({
    mutationFn: (id: string) => notificationService.adminDeleteNotification(id),
    onSuccess: async () => {
      await cacheClear();
      await queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
      toast.success('Notification deleted.');
    },
    onError: () => {
      toast.error('Failed to delete notification. Please try again.');
    },
  });
}
