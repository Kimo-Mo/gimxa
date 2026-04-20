import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  couponFormSchema,
  CouponFormValues,
  SCOPE_OPTIONS,
  DISCOUNT_TYPE_OPTIONS,
} from './coupon-schema';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { couponService } from '@/services/coupon.service';
import { authService } from '@/services/auth.service';
import { couponKeys } from './couponKeys';
import { toast } from 'sonner';
import { AdminCoupon, AdminCouponPayload } from '@/types/admin/coupons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CouponEditFormProps {
  coupon: AdminCoupon;
}

export default function CouponEditForm({ coupon }: CouponEditFormProps) {
  const queryClient = useQueryClient();

  const defaultValues: CouponFormValues = {
    code: coupon.code,
    scope: coupon.scope as 'global' | 'product' | 'package' | 'category',
    discount_type: coupon.discount_type as 'percent' | 'fixed',
    discount_value: Number(coupon.discount_value) || 0,
    start_at: coupon.start_at ? coupon.start_at.slice(0, 16) : '',
    end_at: coupon.end_at ? coupon.end_at.slice(0, 16) : '',
    max_usage: coupon.max_usage || undefined,
    is_active: coupon.is_active,
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CouponFormValues>({
    resolver: zodResolver(couponFormSchema),
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupon.id]);

  const scopeValue = watch('scope');
  const discountTypeValue = watch('discount_type');

  const mutation = useMutation({
    mutationFn: (payload: AdminCouponPayload) => couponService.adminUpdateCoupon(coupon.id, payload),
    onSuccess: async () => {
      await authService.clearCache();
      queryClient.invalidateQueries({ queryKey: couponKeys.all });
      queryClient.invalidateQueries({ queryKey: couponKeys.detail(coupon.id) });
      toast.success('Coupon updated');
    },
    onError: () => toast.error('Failed to update coupon'),
  });

  const onSubmit = (formData: CouponFormValues) => {
    const payload: AdminCouponPayload = {
      ...formData,
      start_at: new Date(formData.start_at).toISOString(),
      end_at: new Date(formData.end_at).toISOString(),
      max_usage: formData.max_usage || undefined,
    };
    mutation.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-card p-6 rounded-lg border">
      <div className="space-y-2">
        <Label htmlFor="code">Code</Label>
        <Input id="code" {...register('code')} disabled className="bg-muted" />
        {errors.code && <p className="text-destructive text-xs">{errors.code.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="scope">Scope</Label>
        <Select
          value={scopeValue}
          onValueChange={(val) => setValue('scope', val as 'global' | 'product' | 'package' | 'category')}
          disabled={mutation.isPending}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select scope" />
          </SelectTrigger>
          <SelectContent>
            {SCOPE_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.scope && <p className="text-destructive text-xs">{errors.scope.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="discount_type">Discount Type</Label>
          <Select
            value={discountTypeValue}
            onValueChange={(val) => setValue('discount_type', val as 'percent' | 'fixed')}
            disabled={mutation.isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {DISCOUNT_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt === 'percent' ? 'Percentage' : 'Fixed Amount'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.discount_type && (
            <p className="text-destructive text-xs">{errors.discount_type.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="discount_value">Value</Label>
          <Input
            id="discount_value"
            type="number"
            step="0.01"
            {...register('discount_value', { valueAsNumber: true })}
            disabled={mutation.isPending}
          />
          {errors.discount_value && (
            <p className="text-destructive text-xs">{errors.discount_value.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_at">Start Date</Label>
          <Input
            id="start_at"
            type="datetime-local"
            {...register('start_at')}
            disabled={mutation.isPending}
          />
          {errors.start_at && <p className="text-destructive text-xs">{errors.start_at.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_at">End Date</Label>
          <Input
            id="end_at"
            type="datetime-local"
            {...register('end_at')}
            disabled={mutation.isPending}
          />
          {errors.end_at && <p className="text-destructive text-xs">{errors.end_at.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="max_usage">Max Usage (Optional)</Label>
        <Input
          id="max_usage"
          type="number"
          placeholder="Unlimited"
          {...register('max_usage', {
            setValueAs: (v) => (v === '' ? undefined : parseInt(v, 10)),
          })}
          disabled={mutation.isPending}
        />
        {errors.max_usage && <p className="text-destructive text-xs">{errors.max_usage.message}</p>}
      </div>

      <div className="flex items-center gap-2 pt-2">
        <input
          type="checkbox"
          id="is_active_edit"
          {...register('is_active')}
          disabled={mutation.isPending}
        />
        <Label htmlFor="is_active_edit">Active</Label>
      </div>

      <div className="flex justify-start pt-4">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
