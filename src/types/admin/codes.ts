// Admin-scoped code vault types

export interface AdminCode {
  id: number;
  code: string;
  assigned: boolean;
  is_used: boolean;
  package_id?: number | null;
  product_slug?: string;
  created_at?: string;
}

export interface AdminCodePayload {
  code?: string;
  codes?: string; // used for bulk syncing multiple codes at once
  package_id?: string | number;
}

export interface AdminCodeUpdatePayload {
  assigned?: boolean;
  code?: string;
  is_used?: boolean; // required for the invalidation mutation payload
}

export interface AdminCodeListResponse {
  total_codes: number;     // total count of all codes regardless of is_used status
  available_codes: number; // count of codes where is_used = false
  codes: AdminCode[];      // unpaginated array of all code objects for this product/package
}
