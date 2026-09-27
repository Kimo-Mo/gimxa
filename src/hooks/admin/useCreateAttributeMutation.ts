import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/api/axios';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

export function useCreateAttributeMutation(type: 'regions' | 'types' | 'platforms') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await axiosInstance.post(`/catalog/admin/${type}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success(`Successfully created ${type.slice(0, -1)}`);
      queryClient.invalidateQueries({ queryKey: ['admin', type] });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(`Failed to create: ${error.response?.data?.message || error.message}`);
    },
  });
}
