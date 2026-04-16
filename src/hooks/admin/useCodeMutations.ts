import { useMutation, useQueryClient } from '@tanstack/react-query';
import { codeService } from '@/services/code.service';
import { useCacheClear } from './useCacheClear';
import { toast } from 'sonner';
import type { AdminCodeUpdatePayload } from '@/types/admin/codes';

// Bulk-add codes for a product (no package_id)
export const useAddProductCodesMutation = (slug: string) => {
  const queryClient = useQueryClient();
  const cacheClear = useCacheClear();

  return useMutation({
    mutationFn: (codesText: string) => {
      // codesText is a newline-delimited string; strip blank lines before sending
      const cleaned = codesText
        .split('\n')
        .map((c) => c.trim())
        .filter(Boolean)
        .join('\n');
      return codeService.adminAddUpdateDeleteCodes(slug, { codes: cleaned });
    },
    onSuccess: async () => {
      await cacheClear();
      queryClient.invalidateQueries({ queryKey: ['admin', 'codes', slug] });
      toast.success('Codes added successfully.');
    },
    onError: () => {
      toast.error('Failed to add codes.');
    },
  });
};

// Mark a single code as used (invalidate). Also allows editing the code string simultaneously.
export const useInvalidateCodeMutation = (slug: string) => {
  const queryClient = useQueryClient();
  const cacheClear = useCacheClear();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AdminCodeUpdatePayload }) =>
      codeService.adminUpdateSingleCode(slug, id, payload),
    onSuccess: async () => {
      await cacheClear();
      queryClient.invalidateQueries({ queryKey: ['admin', 'codes', slug] });
      toast.success('Code invalidated.');
    },
    onError: () => {
      toast.error('Failed to invalidate code.');
    },
  });
};

// Permanently delete a single code
export const useDeleteCodeMutation = (slug: string) => {
  const queryClient = useQueryClient();
  const cacheClear = useCacheClear();

  return useMutation({
    mutationFn: (id: number) => codeService.adminDeleteSingleCode(slug, id),
    onSuccess: async () => {
      await cacheClear();
      queryClient.invalidateQueries({ queryKey: ['admin', 'codes', slug] });
      toast.success('Code deleted.');
    },
    onError: () => {
      toast.error('Failed to delete code.');
    },
  });
};
