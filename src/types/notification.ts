export interface SendNotificationPayload {
  subject: string;
  message: string;
  user?: string;
  email_type: 'default';
}

export interface NotificationListParams {
  page?: number;
  limit?: number;
}
