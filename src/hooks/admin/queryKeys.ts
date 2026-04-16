import type { CatalogSearchParams } from '@/types';
import type { AdminTopupListParams } from '@/types/admin/topups';

export const adminQueryKeys = {
  products: (params: CatalogSearchParams) => ['admin', 'products', params] as const,
  product: (slug: string) => ['admin', 'product', slug] as const,
  topups: (params: AdminTopupListParams) => ['admin', 'topups', params] as const,
  topup: (slug: string) => ['admin', 'topup', slug] as const,
  packages: (slug: string) => ['admin', 'packages', slug] as const,
  categories: () => ['admin', 'categories'] as const,
  tags: () => ['admin', 'tags'] as const,
} as const;
