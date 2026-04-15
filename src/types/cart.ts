import { Product } from './catalog';

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  formData?: Record<string, string>;
  topup_data?: Record<string, string>;
  unit_price?: string;
}

export interface CartPayload {
  product_slug: string;
  quantity: number;
  topup_package_id?: number;
  topup_data?: Record<string, string>;
}
export interface CartResponse {
  id: string;
  items: CartItem[];
  coupon: string | null;
  subtotal: string;
  discount: string;
  total_after_discount: string;
}