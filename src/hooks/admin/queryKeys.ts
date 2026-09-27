import type { CatalogSearchParams } from '@/types';
import type { AdminTopupListParams } from '@/types/admin/topups';
import type { AdminOrderListParams } from '@/types/admin/orders';
import type { UserListParams } from '@/types/admin/users';
import type { AdminNotificationListParams } from '@/types/admin/notifications';
import type { AdminPaymentListParams } from '@/types/admin/payments';

export const adminQueryKeys = {
  products: (params: CatalogSearchParams) => ['admin', 'products', params] as const,
  product: (slug: string) => ['admin', 'product', slug] as const,
  topups: (params: AdminTopupListParams) => ['admin', 'topups', params] as const,
  topup: (slug: string) => ['admin', 'topup', slug] as const,
  packages: (slug: string) => ['admin', 'packages', slug] as const,
  categories: () => ['admin', 'categories'] as const,
  tags: () => ['admin', 'tags'] as const,
  orders: (params: AdminOrderListParams) => ['admin', 'orders', params] as const,
  orderStats: () => ['admin', 'orderStats'] as const,
  order: (id: string) => ['admin', 'order', id] as const,
  users: (params: UserListParams) => ['admin', 'users', params] as const,
  user: (id: string) => ['admin', 'user', id] as const,
  notifications: (params: AdminNotificationListParams) =>
    ['admin', 'notifications', params] as const,
  notification: (id: string | number) => ['admin', 'notification', id] as const,
  payments: (params: AdminPaymentListParams) => ['admin', 'payments', params] as const,
  payment: (id: number | string) => ['admin', 'payment', id] as const,
} as const;
