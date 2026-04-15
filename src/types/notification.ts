export interface SendNotificationPayload {
  title: string;
  message: string;
  user_id?: string;
}

export interface NotificationListParams {
  page?: number;
  limit?: number;
}
