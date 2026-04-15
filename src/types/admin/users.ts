// Admin-scoped user types, sourced from UserAdminListSerializer & AdminCreateUserSerializer

export type RoleEnum = 'user' | 'admin' | 'seller' | 'developer';
export type ProviderEnum = 'email' | 'google' | 'facebook' | string;

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  role: RoleEnum;
  avatar: string | null;
  is_verified: boolean;
  provider: ProviderEnum;
  last_login: string | null;
  date_joined: string;
  last_updated: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  is_hidden: boolean;
}

export interface AdminCreateUserPayload {
  email: string;
  username: string;
  password: string;
  confirm_password: string;
  full_name?: string;
  role?: RoleEnum;
  is_superuser?: boolean;
  is_staff?: boolean;
  is_verified?: boolean;
  is_active?: boolean;
}

export interface AdminUpdateUserPayload {
  username?: string;
  email?: string;
  full_name?: string;
  role?: RoleEnum;
  is_active?: boolean;
  is_staff?: boolean;
}

export interface UserListParams {
  search?: string;
  role?: string;
  page?: number;
  page_size?: number;
}
