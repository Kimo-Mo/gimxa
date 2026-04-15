import { Product, ProductType } from './catalog';

export interface TopUpProduct extends Product {
  id: number;
  name: string;
  slug: string;
  main_image: { image: string , is_main: boolean, id: number} | null;
  logo: string | null;
  product_type: ProductType;
}

export interface TopUpPackage {
  id: number;
  name: string;
  price: number;
  currency: string;
  amount: string;
}

export interface TopUp {
  id: number;
  packages: TopUpPackage[];
  product: TopUpProduct;
}

export interface TopupsListParams {
  
  search?: string;
  category?: string;
  page_size?: number;
  filter?: string;
}

export interface TopupPayload {
  product: number;
  name?: string;
  description?: string;
}

export interface TopupFieldPayload {
  title: string;
  placeholder?: string;
  key?: string;
  field_type: string;
  is_required: boolean;
  order?: number;
  min_input_length?: number;
  game?: number; // topup game id for association
}

export interface TopupFieldHelpPayload {
  field: number;
  description: string;
  image?: FormData;
}

export interface TopupPackagePayload {
  name: string;
  price: number;
}

export interface ValidateTopupPayload {
  product_slug: string;
  data: Record<string, string | number>;
}
