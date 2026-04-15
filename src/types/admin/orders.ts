// Admin-scoped order types, sourced from OrderListSerializer & OrderDetailSerializer

export type OrderStatus = 'pending' | 'completed' | 'cancelled' | 'failed' | 'processing';

export interface OrderPaymentDetails {
  gateway_id: number;
  gateway_name: string;
  status: string;
  amount: string;
}

export interface AdminOrder {
  id: number;
  order_number: string;
  status: OrderStatus;
  total_price: string;
  subtotal: string;
  tax: string;
  discount_total: string;
  coupon_code: string | null;
  created_at: string;
  user: string; // user id or username depending on context
  items_count: number;
  payment_details: OrderPaymentDetails | null;
}

export interface AdminOrderItem {
  id: number;
  product_name: string;
  product_slug: string;
  quantity: number;
  price: string;
  is_topup: boolean;
  topup_package: number | null;
  topup_data: Record<string, string> | null;
  created_at: string;
}

export interface AdminOrderDetail {
  id: number;
  order_number: string;
  status: OrderStatus;
  subtotal: string;
  tax: string;
  coupon_code: string | null;
  discount_total: string;
  total_price: string;
  created_at: string;
  items: AdminOrderItem[];
  payment_details: OrderPaymentDetails | null;
}

export interface AdminOrderListParams {
  status?: string;
  page?: number;
  page_size?: number;
  search?: string;
}

export interface AdminOrderUpdatePayload {
  status: OrderStatus;
}
