// Admin-scoped notification types

export interface AdminNotification {
  id: number;
  subject: string;
  message: string;
  user: {
    id: number;
    full_name: string;
    email: string;
    username: string;
  } | null;
  created_at: string;
  is_read?: boolean;
  is_deleted?: boolean;
  email_type: string;
  emailed_at: string | null;
  readed_at: string | null;
  deleted_at: string | null;
}

export interface AdminSendNotificationPayload {
  subject: string;
  message: string;
  user_id?: string; // if undefined, sends to all users
}

export interface AdminNotificationListParams {
  page?: number;
  limit?: number;
}
