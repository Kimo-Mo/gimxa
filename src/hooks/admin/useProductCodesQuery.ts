import { useQuery } from '@tanstack/react-query';
import { codeService } from '@/services/code.service';
import type { AdminCodeListResponse } from '@/types/admin/codes';

export const useProductCodesQuery = (slug: string) => {
  return useQuery<AdminCodeListResponse>({
    queryKey: ['admin', 'codes', slug],
    queryFn: () => codeService.adminCodeListForProduct(slug) as Promise<AdminCodeListResponse>,
    enabled: !!slug,
    refetchOnWindowFocus: false,
  });
};
