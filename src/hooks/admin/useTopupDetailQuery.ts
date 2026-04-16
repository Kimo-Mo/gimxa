import { useQueries } from '@tanstack/react-query';
import { adminQueryKeys } from './queryKeys';
import { topupService } from '@/services/topup.service';
import { catalogService } from '@/services/catalog.service';
import type { AdminTopupGame } from '@/types/admin/topups';

export const useTopupDetailQuery = (slug: string) => {
  const [topupQuery, packagesQuery, categoriesQuery] = useQueries({
    queries: [
      {
        queryKey: adminQueryKeys.topup(slug),
        queryFn: () => topupService.adminTopupDetail(slug) as Promise<AdminTopupGame>,
        enabled: !!slug,
      },
      {
        queryKey: adminQueryKeys.packages(slug),
        queryFn: async () => {
          const res = await topupService.adminPackagesList(slug, {});
          return res;
        },
        enabled: !!slug,
      },
      {
        queryKey: adminQueryKeys.categories(),
        queryFn: () => catalogService.adminCategoriesList(),
        staleTime: Infinity,
        enabled: !!slug,
      },
    ],
  });

  return { topupQuery, packagesQuery, categoriesQuery };
};
