import api from '../lib/api/axios';
import { SendNotificationPayload } from '@/types';
import type { AdminNotificationListParams } from '@/types/admin/notifications';

export const notificationService = {
  // Public
  getNotificationsList: async () => {
    const { data } = await api.get('/notifications/all/');
    return data;
  },
  getNotificationDetail: async (id: string) => {
    const { data } = await api.get(`/notifications/notification/${id}/`);
    return data;
  },
  deleteNotification: async (id: string) => {
    const { data } = await api.delete(`/notifications/notification/${id}/`);
    return data;
  },
  deleteAllMyNotifications: async () => {
    const { data } = await api.delete('/notifications/all/delete/');
    return data;
  },

  // Admin
  adminSendNotification: async (payload: SendNotificationPayload) => {
    const { data } = await api.post('/notifications/admin/all/', payload);
    return data;
  },
  adminNotificationsList: async (params?: AdminNotificationListParams) => {
    const { data } = await api.get('/notifications/admin/all', { params });
    return data;
  },
  adminNotificationDetail: async (id: string) => {
    const { data } = await api.get(`/notifications/admin/notification/${id}/`);
    return data;
  },
  adminDeleteNotification: async (id: string) => {
    const { data } = await api.delete(`/notifications/admin/notification/${id}/`);
    return data;
  },
};
