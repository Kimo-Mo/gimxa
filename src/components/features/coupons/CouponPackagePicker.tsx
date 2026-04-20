import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { topupService } from '@/services/topup.service';
import { couponService } from '@/services/coupon.service';
import { authService } from '@/services/auth.service';
import { couponKeys } from './couponKeys';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { AdminCoupon } from '@/types/admin/coupons';

interface CouponPackagePickerProps {
  coupon: AdminCoupon;
}

interface ResourceItem {
  id: string | number;
  slug?: string;
  name?: string;
  title?: string;
  product?: { slug?: string; name?: string };
}

export default function CouponPackagePicker({ coupon }: CouponPackagePickerProps) {
  const queryClient = useQueryClient();
  const [selectedTopup, setSelectedTopup] = useState<string>('');
  const [selected, setSelected] = useState<string[]>([]);

  // Query topups
  const { data: topupsData, isPending: topupsLoading } = useQuery({
    queryKey: ['admin', 'topups'],
    queryFn: () => topupService.adminTopupsList(),
  });
  const topups = Array.isArray(topupsData) ? topupsData : topupsData?.results ?? [];

  // Query packages for selected topup
  const { data: packagesData, isPending: packagesLoading } = useQuery({
    queryKey: ['admin', 'packages', selectedTopup],
    queryFn: () => topupService.adminPackagesList(selectedTopup),
    enabled: !!selectedTopup,
  });
  const packages = Array.isArray(packagesData) ? packagesData : packagesData?.results ?? [];

  const addMutation = useMutation({
    mutationFn: (ids: string[]) => {
      const promises = ids.map((id) =>
        couponService.adminAddPackageToCoupon(coupon.id, {
          package: id,
          discount_type: coupon.discount_type,
          discount_value: Number(coupon.discount_value),
        })
      );
      return Promise.all(promises);
    },
    onSuccess: async () => {
      await authService.clearCache();
      queryClient.invalidateQueries({ queryKey: couponKeys.detail(coupon.id) });
      toast.success('Packages added');
      setSelected([]);
    },
    onError: () => toast.error('Failed to add packages'),
  });

  const handleToggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleAdd = () => {
    if (selected.length > 0) {
      addMutation.mutate(selected);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Add Packages</h3>

      <div className="flex gap-2">
        <Select value={selectedTopup} onValueChange={(v) => { setSelectedTopup(v); setSelected([]); }} disabled={topupsLoading}>
          <SelectTrigger className="max-w-sm">
            <SelectValue placeholder="Select a game/topup" />
          </SelectTrigger>
          <SelectContent>
            {topups.map((t: ResourceItem) => (
              <SelectItem key={t.product?.slug || t.slug} value={(t.product?.slug || t.slug) as string}>
                {t.product?.name || t.name || t.title || t.slug || t.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={handleAdd} disabled={selected.length === 0 || addMutation.isPending}>
          {addMutation.isPending ? 'Adding...' : 'Add Selected'}
        </Button>
      </div>

      <div className="border rounded-md min-h-40 max-h-64 overflow-y-auto p-4 space-y-2">
        {!selectedTopup ? (
          <p className="text-muted-foreground">Select a game/topup first.</p>
        ) : packagesLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : packages.length === 0 ? (
          <p className="text-muted-foreground">No packages found for this topup.</p>
        ) : (
          packages.map((pkg: ResourceItem) => (
            <div key={pkg.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`package-${pkg.id}`}
                checked={selected.includes(pkg.id.toString())}
                onChange={() => handleToggle(pkg.id.toString())}
                className="w-4 h-4"
              />
              <label htmlFor={`package-${pkg.id}`} className="text-sm">
                {pkg.name || pkg.title || pkg.slug || pkg.id}
              </label>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
