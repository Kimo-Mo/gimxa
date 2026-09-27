import { ProductImage } from './common';

export interface ProductTag {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
}

export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent?: number | null;
  level?: number;
  order?: number;
  is_active?: boolean;
  image?: string | null;
  logo?: string | null;
  children?: ProductCategory[];
}

// Must match Django's ProductType.choices exactly
export type ProductType = 'game' | 'topup' | 'giftcard' | 'software' | 'console' | string;

export interface BaseAttribute {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  is_active: boolean;
}

export type Region = BaseAttribute;
export type Platform = BaseAttribute;
export type ProductTypeEntity = BaseAttribute;

export interface Product {
  id: number;
  name: string;
  slug: string;
  price: number | null;
  price_before_offer?: number | null;
  offer_value?: number | null;
  discount_percent?: number;
  product_type: ProductType;
  main_image: ProductImage | string | null;
  categories: ProductCategory[];
  tags: ProductTag[];

  // Optional/Detail fields
  stock_mode?: string;
  manual_fulfillment_time?: string | null;
  description?: string;
  short_description?: string;
  is_active?: boolean;
  is_available?: boolean;
  is_popular?: boolean;
  is_featured?: boolean;
  is_topup?: boolean;
  region?: Region | null;
  type?: ProductTypeEntity | null;
  platform?: Platform | null;
  help?: string | null;
  logo?: string | null;
  info?: string | null;
  currency?: string;
  images?: ProductImage[];
  attributes?: { id: number; name: string; value: string }[];
  product?: Product;
}

export interface CatalogSearchParams {
  search?: string;
  category?: string;
  categories?: string | string[];
  is_popular?: boolean;
  tags?: string | string[];
  price_min?: number;
  price_max?: number;
  ordering?: string;
  region?: string | string[];
  page?: number;
  page_size?: number;
  topups?: boolean;
  product_types?: string | string[];
  is_available?: boolean;
  is_featured?: boolean;
  platform?: string;
  type?: string;
  is_topup?: boolean;
  filter?: string;
}

export interface CategoryPayload {
  name: string;
  description?: string;
  image?: File | string;
}

export interface ProductPayload {
  name: string;
  category_id: string;
  description?: string;
  price?: number;
}

export interface TagPayload {
  name: string;
}
