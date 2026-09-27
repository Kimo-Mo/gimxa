// Admin-scoped topup types, based on topup service and serializers

export interface AdminTopupFieldHelp {
  id: number;
  description: string;
  image: string | null;
}

export interface AdminTopupGameField {
  id: number;
  title: string;
  placeholder: string;
  key: string;
  field_type: string;
  is_required: boolean;
  order: number;
  min_input_length: number;
  helps: AdminTopupFieldHelp[];
}

export interface AdminTopupPackage {
  id: number;
  name: string;
  amount: string;
  price: string;
  price_before_offer?: string | null;
  offer_value?: string | null;
  image: string | null;
  is_active: boolean;
  is_popular: boolean;
  order: number;
  stock_mode: string;
  manual_fulfillment_time: number | null;
}

export interface AdminTopupGame {
  id: number;
  product: {
    id: number;
    name: string;
    slug: string;
    main_image: { image: string } | null;
    logo: string | null;
    product_type: string;
    is_active: boolean;
    is_available: boolean;
    is_featured: boolean;
    categories?: { id: number; name: string }[];
  };
  logo: string | null;
  is_active: boolean;
  fields: AdminTopupGameField[];
  packages: AdminTopupPackage[];
}

export interface AdminTopupListParams {
  search?: string;
  category?: string;
  page?: number;
  page_size?: number;
}

export interface AdminTopupFieldPayload {
  title: string;
  placeholder?: string;
  key: string;
  field_type: string;
  is_required: boolean;
  order?: number;
  min_input_length?: number;
}

export interface AdminTopupPackagePayload {
  name: string;
  amount: string;
  price: number;
  image?: File | null;
  is_active?: boolean;
  is_popular?: boolean;
  order?: number;
  stock_mode: string;
  manual_fulfillment_time?: number | null;
  codes?: string[];
}
