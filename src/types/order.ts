export interface OrderListParams {
  status?: string;
  filter?: string;
  page?: number;
  page_size?: number;
  search?: string;
}

export interface OrderBuyNowPayload {
  product_slug: string;
  quantity: number;
  topup_package_id?: string;
  topup_data?: Record<string, string>;
  coupon_code?: string;
}

export interface OrderUpdatePayload {
  status: string;
}
