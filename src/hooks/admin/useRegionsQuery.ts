import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/lib/api/axios';

export function useRegionsQuery() {
  return useQuery({
    queryKey: ['admin', 'regions'],
    queryFn: async () => {
      const response = await axiosInstance.get('/catalog/admin/regions/');
      return response.data || [];
    },
  });
}
