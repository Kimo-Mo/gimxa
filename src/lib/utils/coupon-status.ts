import { AdminCoupon } from '@/types/admin/coupons';

export type CouponDisplayStatus = 'active' | 'upcoming' | 'expired' | 'inactive';

export function computeCouponStatus(coupon: AdminCoupon): CouponDisplayStatus {
  const now = new Date();
  const start = new Date(coupon.start_at);
  const end = new Date(coupon.end_at);

  if (end < now) return 'expired';
  if (start > now) return 'upcoming';
  if (coupon.is_active) return 'active';
  return 'inactive';
}
