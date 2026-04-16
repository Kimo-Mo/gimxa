import { useQuery } from '@tanstack/react-query';
import { codeService } from '@/services/code.service';
import type { AdminCodeListResponse } from '@/types/admin/codes';

export const usePackageCodesQuery = (slug: string, packageId: number) => {
  return useQuery<AdminCodeListResponse>({
    queryKey: ['admin', 'codes', slug, packageId],
    queryFn: () =>
      codeService.adminCodeListForProductPackage(slug, {
        package_id: String(packageId),
      }) as Promise<AdminCodeListResponse>,
    enabled: !!slug && !!packageId,
    refetchOnWindowFocus: false,
  });
};
