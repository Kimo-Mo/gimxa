import { useQuery } from '@tanstack/react-query';
import { adminQueryKeys } from './queryKeys';
import { topupService } from '@/services/topup.service';
import type { AdminTopupGame } from '@/types/admin/topups';
import type { PaginatedResponse } from '@/types';

export const useTopupsQuery = ({ page, search }: { page: number; search: string }) => {
  return useQuery<PaginatedResponse<AdminTopupGame>>({
    queryKey: adminQueryKeys.topups({ page, page_size: 10, ...(search ? { search } : {}) }),
    queryFn: () => topupService.adminTopupsList({ 
      page, 
      page_size: 10, 
      ...(search ? { search } : {}) 
    }),
  });
};
