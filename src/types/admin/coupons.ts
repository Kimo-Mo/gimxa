// Admin-scoped coupon types, based on coupon service and serializers

export type DiscountType = 'percent' | 'fixed';

export interface AdminCoupon {
  id: number;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  active: boolean;
  usage_count?: number;
  created_at?: string;
}

export interface AdminCouponPayload {
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  active?: boolean;
}

export interface AdminCouponUsage {
  id: number;
  user: string;
  order: string;
  used_at: string;
}

export interface AdminAddResourceToCouponPayload {
  resource_ids: string[];
}
