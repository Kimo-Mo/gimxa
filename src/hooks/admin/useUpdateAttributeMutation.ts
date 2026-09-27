import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/api/axios';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

export function useUpdateAttributeMutation(type: 'regions' | 'types' | 'platforms') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const response = await axiosInstance.put(`/catalog/admin/${type}/${id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success(`Successfully updated ${type.slice(0, -1)}`);
      queryClient.invalidateQueries({ queryKey: ['admin', type] });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(`Failed to update: ${error.response?.data?.message || error.message}`);
    },
  });
}
