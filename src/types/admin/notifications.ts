// Admin-scoped notification types

export interface AdminNotification {
  id: number;
  title: string;
  message: string;
  user: string | null;
  created_at: string;
  is_read?: boolean;
}

export interface AdminSendNotificationPayload {
  title: string;
  message: string;
  user_id?: string; // if undefined, sends to all users
}

export interface AdminNotificationListParams {
  page?: number;
  limit?: number;
}
