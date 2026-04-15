export interface AdminCodePayload {
  code?: string;
  codes?: string;
  package_id?: string | number;
}

export interface AdminCodeUpdatePayload {
  assigned?: boolean;
  code?: string;
}
