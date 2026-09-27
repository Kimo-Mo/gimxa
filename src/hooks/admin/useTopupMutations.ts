import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';
import { topupService } from '@/services/topup.service';
import { codeService } from '@/services/code.service';
import { useCacheClear } from './useCacheClear';
import { toast } from 'sonner';

import type { FieldForm, PackageForm } from '@/components/admin/topups/types';
import type { AdminTopupFieldPayload } from '@/types/admin/topups';
import { AdminCodePayload } from '@/types';

export const useUpdateTopupGameInfoMutation = (slug: string) => {
  const queryClient = useQueryClient();
  const cacheClear = useCacheClear();

  return useMutation({
    mutationFn: async ({ formData, isActive }: { formData: FormData; isActive: boolean }) => {
      formData.append('is_active', String(isActive));
      return await dashboardService.adminUpdateProductFull(slug, formData);
    },
    onSuccess: async (data) => {
      await cacheClear();
      queryClient.invalidateQueries({ queryKey: ['admin', 'topup', slug] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'topups'] });

      if (data?.status === 'partial_success' || data?.message?.includes('partial')) {
        toast.warning(
          data?.message || 'Game info partially updated. Some fields may not have saved.'
        );
      } else {
        toast.success('Game info updated successfully.');
      }
    },
    onError: () => {
      toast.error('Failed to update game info.');
    },
  });
};

export const useSaveTopupFieldsMutation = ({
  slug,
  topupId,
}: {
  slug: string;
  topupId: number;
}) => {
  const queryClient = useQueryClient();
  const cacheClear = useCacheClear();

  return useMutation({
    mutationFn: async (fields: FieldForm[]) => {
      for (const field of fields) {
        let autoKey = field.key;
        if (!autoKey && field.title) {
          autoKey = field.title
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/, '');
        }

        const payload = {
          title: field.title,
          placeholder: field.placeholder,
          key: autoKey,
          field_type: field.field_type,
          is_required: field.is_required,
          order: field.order,
          min_input_length: field.min_input_length,
        };

        let currentFieldId = field.id;
        if (field.id) {
          await topupService.adminUpdateField(
            field.id,
            payload as unknown as AdminTopupFieldPayload
          );
        } else {
          const res = await topupService.adminAddField({
            ...payload,
            game: topupId,
          } as unknown as AdminTopupFieldPayload);
          const created = Array.isArray(res) ? res[0] : res;
          currentFieldId = created.id;
        }

        for (const help of field.helps || []) {
          if (!help.id && !help.description.trim()) continue;
          const helpFd = new FormData();
          if (currentFieldId) {
            helpFd.append('field', String(currentFieldId));
          }
          helpFd.append('description', help.description);
          if (help.imageFile) {
            helpFd.append('image', help.imageFile);
          }
          if (help.id) {
            await topupService.adminUpdateFieldHelp(help.id, helpFd);
          } else {
            await topupService.adminAddFieldHelp(helpFd);
          }
        }
      }
    },
    onSuccess: async () => {
      await cacheClear();
      queryClient.invalidateQueries({ queryKey: ['admin', 'topup', slug] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'topups'] });
      toast.success('Fields saved successfully.');
    },
    onError: () => {
      toast.error('Failed to save fields.');
    },
  });
};

export const useSaveTopupPackagesMutation = ({
  slug,
  topupId,
}: {
  slug: string;
  topupId: number;
}) => {
  const queryClient = useQueryClient();
  const cacheClear = useCacheClear();

  return useMutation({
    mutationFn: async (packages: PackageForm[]) => {
      for (const pkg of packages) {
        const fd = new FormData();
        fd.append('name', pkg.name);
        fd.append('amount', pkg.amount);
        fd.append('price', pkg.price);
        if (pkg.price_before_offer) fd.append('price_before_offer', pkg.price_before_offer);
        if (pkg.offer_value) fd.append('offer_value', pkg.offer_value);
        else fd.append('offer_value', '');
        fd.append('is_active', String(pkg.is_active));
        fd.append('is_popular', String(pkg.is_popular));
        fd.append('order', String(pkg.order));
        fd.append('stock_mode', pkg.stock_mode || 'manual');
        if (pkg.stock_mode === 'manual' && pkg.manual_fulfillment_time) {
          fd.append('manual_fulfillment_time', String(pkg.manual_fulfillment_time));
        } else if (pkg.stock_mode === 'automatic') {
          // Send 0 to override/clear manual time
          fd.append('manual_fulfillment_time', '0');
        }
        if (pkg.imageFile) {
          fd.append('image', pkg.imageFile);
        }
        fd.append('game', String(topupId));

        let pkgId = pkg.id;
        if (pkg.id) {
          await topupService.adminUpdatePackage(pkg.id, fd);
        } else {
          const res = await topupService.adminAddPackage(fd);
          pkgId = res.id;
        }

        if (pkg.stock_mode === 'automatic' && pkg.codes?.trim() && pkgId) {
          const codeArray = pkg.codes
            .split('\n')
            .map((c: string) => c.trim())
            .filter(Boolean);
          if (codeArray.length > 0) {
            // Fetch existing codes to prevent overwriting during PUT sync
            const existingData = await codeService.adminCodeListForProductPackage(slug, { package_id: String(pkgId) });
            const existingCodes = (existingData.codes || []).map((c: { code: string }) => c.code);
            const fullCodesList = [...existingCodes, ...codeArray].join('\n');

            await codeService.adminAddUpdateDeleteCodes(slug, {
              codes: fullCodesList,
              package_id: String(pkgId),
            } as AdminCodePayload);
          }
        }
      }
    },
    onSuccess: async () => {
      await cacheClear();
      queryClient.invalidateQueries({ queryKey: ['admin', 'topup', slug] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'packages', slug] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'codes', slug] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'topups'] });
      toast.success('Packages saved successfully.');
    },
    onError: () => {
      toast.error('Failed to save packages.');
    },
  });
};

export const useDeleteTopupItemMutation = (slug: string) => {
  const queryClient = useQueryClient();
  const cacheClear = useCacheClear();

  return useMutation({
    mutationFn: ({ type, id }: { type: 'field' | 'package'; id: number }) => {
      if (type === 'field') return topupService.adminDeleteField(id);
      return topupService.adminDeletePackage(id);
    },
    onSuccess: async (_, { type }) => {
      await cacheClear();
      queryClient.invalidateQueries({ queryKey: ['admin', 'topup', slug] });
      if (type === 'package')
        queryClient.invalidateQueries({ queryKey: ['admin', 'packages', slug] });
      toast.success(`${type === 'field' ? 'Field' : 'Package'} deleted.`);
    },
    onError: (_, { type }) => {
      toast.error(`Failed to delete ${type}.`);
    },
  });
};

