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
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  active?: boolean;
}
export interface AdminAddResourceToCouponPayload {
  resource_ids: string[];
}
