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
import { AdminCouponPayload } from '@/types/admin/coupons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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

interface CouponCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CouponCreateDialog({ open, onOpenChange }: CouponCreateDialogProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CouponFormValues>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: {
      code: '',
      scope: 'global',
      discount_type: 'percent',
      discount_value: 0,
      start_at: '',
      end_at: '',
      is_active: true,
    },
  });

  const scopeValue = watch('scope');
  const discountTypeValue = watch('discount_type');

  const mutation = useMutation({
    mutationFn: (payload: AdminCouponPayload) => couponService.adminAddCoupon(payload),
    onSuccess: async () => {
      await authService.clearCache();
      queryClient.invalidateQueries({ queryKey: couponKeys.all });
      toast.success('Coupon created successfully');
      onOpenChange(false);
      reset();
    },
    onError: () => toast.error('Failed to create coupon'),
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
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Coupon</DialogTitle>
          <DialogDescription>Add a new coupon to the system.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              {...register('code', {
                onChange: (e) => setValue('code', e.target.value.toUpperCase()),
              })}
              disabled={mutation.isPending}
              placeholder="e.g. SUMMER2026"
            />
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
              {errors.start_at && (
                <p className="text-destructive text-xs">{errors.start_at.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_at">End Date</Label>
              <Input
                id="end_at"
                type="datetime-local"
                {...register('end_at')}
                disabled={mutation.isPending}
              />
              {errors.end_at && (
                <p className="text-destructive text-xs">{errors.end_at.message}</p>
              )}
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
            {errors.max_usage && (
              <p className="text-destructive text-xs">{errors.max_usage.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_active"
              {...register('is_active')}
              disabled={mutation.isPending}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating...' : 'Create Coupon'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
