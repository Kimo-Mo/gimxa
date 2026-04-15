// Admin-scoped product types, based on dashboard/serializers.py ProductCreateSerializer

export type ProductTypeEnum = 'key' | 'topup';
export type StockModeEnum = 'automatic' | 'manual';

export interface AdminProductAttribute {
  id?: number;
  name: string;
  value: string;
}

export interface AdminProductImage {
  id?: number;
  image: File | string;
  is_main: boolean;
}

export interface AdminTopUpFieldHelp {
  id?: number;
  description?: string;
  image?: File | string | null;
}

export interface AdminTopUpField {
  id?: number;
  title: string;
  placeholder?: string;
  key: string;
  field_type: 'text' | 'number' | 'select' | string;
  is_required: boolean;
  order: number;
  min_input_length: number;
  helps: AdminTopUpFieldHelp[];
}

export interface AdminTopUpPackage {
  id?: number;
  name: string;
  amount: string;
  price: number;
  image?: File | string | null;
  is_active: boolean;
  is_popular: boolean;
  order: number;
  stock_mode: StockModeEnum;
  manual_fulfillment_time?: number | null;
  codes?: string[];
}

/** Payload for POST /dashboard/admin/products/create/ (multipart/form-data) */
export interface AdminProductCreatePayload {
  name: string;
  product_type: ProductTypeEnum;
  price?: number | null;
  stock_mode: StockModeEnum;
  manual_fulfillment_time?: number | null;
  short_description?: string;
  description?: string;
  info?: object | null;
  logo?: File | null;
  is_active?: boolean;
  is_available?: boolean;
  is_popular?: boolean;
  category?: number[]; // category IDs
  tags?: number[]; // tag IDs
  // non-topup
  codes?: string; // JSON array string
  // topup
  topup_logo?: File | null;
  // nested — sent as indexed arrays
  images?: AdminProductImage[];
  attributes?: AdminProductAttribute[];
  fields?: AdminTopUpField[];
  packages?: AdminTopUpPackage[];
}

export interface AdminProductListParams {
  search?: string;
  category?: string;
  page?: number;
  page_size?: number;
  product_type?: ProductTypeEnum;
  is_available?: boolean;
}
