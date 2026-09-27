import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/lib/api/axios';

export function usePlatformsQuery() {
  return useQuery({
    queryKey: ['admin', 'platforms'],
    queryFn: async () => {
      const response = await axiosInstance.get('/catalog/admin/platforms/');
      return response.data || [];
    },
  });
}
