export const storefrontQueryKeys = {
  notifications: () => ['storefront', 'notifications'] as const,
  notification: (id: string | number) => ['storefront', 'notification', id] as const,
} as const;
