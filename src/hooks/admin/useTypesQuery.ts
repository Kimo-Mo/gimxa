import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/lib/api/axios';

export function useTypesQuery() {
  return useQuery({
    queryKey: ['admin', 'types'],
    queryFn: async () => {
      const response = await axiosInstance.get('/catalog/admin/types/');
      return response.data || [];
    },
  });
}
