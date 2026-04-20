// Admin-scoped coupon types, based on coupon service and serializers

export type DiscountType = 'percent' | 'fixed';
export type ScopeType = 'global' | 'product' | 'package' | 'category';

export interface AdminCoupon {
  id: number;
  code: string;
  scope: ScopeType;
  discount_type: DiscountType;
  discount_value: number;
  start_at: string;
  end_at: string;
  is_active: boolean;
  max_usage?: number;
  used_count?: number;
  created_at?: string;
}

export interface AdminCouponPayload {
  code: string;
  scope: ScopeType;
  discount_type: DiscountType;
  discount_value: number;
  start_at: string;
  end_at: string;
  is_active?: boolean;
  max_usage?: number;
}

export interface AdminCouponUsage {
  id: number;
  user: string;
  order: string;
  used_at: string;
}

export interface AdminAddResourceToCouponPayload {
  product?: string | number;
  category?: string | number;
  package?: string | number;
  discount_type?: string;
  discount_value?: number;
}
