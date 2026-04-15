export type FieldType = 'text' | 'number' | 'select';
export type StockMode = 'automatic' | 'manual';

export interface HelpItem {
  id?: number;
  description: string;
  imageFile?: File | null;
  imageUrl?: string | null;
}

export interface FieldForm {
  id?: number;
  title: string;
  placeholder: string;
  key: string;
  field_type: FieldType;
  is_required: boolean;
  order: number;
  min_input_length: number;
  helps: HelpItem[];
}

export interface PackageForm {
  id?: number;
  name: string;
  amount: string;
  price: string;
  is_active: boolean;
  is_popular: boolean;
  order: number;
  stock_mode: StockMode;
  manual_fulfillment_time: string;
  codes: string;
}
