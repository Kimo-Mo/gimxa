export interface CouponValidatePayload {
  code: string;
}
export interface CouponApplyPayload {
  code: string;
}
export interface CouponRemovePayload {
  code: string;
}
export interface AdminCouponPayload {
  code: string;
  scope: string; // global(order), product, package, category
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  start_at: string;
  end_at: string;
  is_active?: boolean;
  max_usage?: number;
}
export interface AdminAddResourceToCouponPayload {
  resource_ids: string[];
}
