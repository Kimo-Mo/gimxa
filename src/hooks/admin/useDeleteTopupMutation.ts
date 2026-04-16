import { useMutation, useQueryClient } from '@tanstack/react-query';
import { catalogService } from '@/services/catalog.service';
import { useCacheClear } from './useCacheClear';
import { toast } from 'sonner';

export const useDeleteTopupMutation = () => {
  const queryClient = useQueryClient();
  const cacheClear = useCacheClear();

  return useMutation({
    mutationFn: (slug: string) => catalogService.adminDeleteProduct(slug),
    onSuccess: async () => {
      await cacheClear();
      queryClient.invalidateQueries({ queryKey: ['admin', 'topups'] });
      toast.success('Top-up deleted successfully.');
    },
    onError: () => {
      toast.error('Failed to delete top-up.');
    },
  });
};
