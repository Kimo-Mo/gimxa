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
  code?: string; // code of game key or topup code sent to user and email_type = code_sent
  user?: string; // user id
  email_type: 'default' | 'code_sent' | 'payment_success' | 'payment_failed' | 'credits_delivered'; // credits_delivered for automatic code delivery
}

export interface AdminNotificationListParams {
  filter?: string; //ALLOWED_FILTERS = {"user", "is_read", "is_deleted", "is_active", "is_emailed", "created_at", "updated_at", "emailed_at", "readed_at"} => filter=user={user id},is_read={true/false} and so on...
  search?: string; // search_with : (username, full_name, email, subject, message, email_type)
  page?: number;
  page_size?: number; // default = 10
}
