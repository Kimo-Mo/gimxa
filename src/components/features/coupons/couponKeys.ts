export const couponKeys = {
  all: ['admin', 'coupons'] as const,
  detail: (id: number | string) => ['admin', 'coupons', id] as const,
  usages: (id: number | string) => ['admin', 'coupons', id, 'usages'] as const,
};
