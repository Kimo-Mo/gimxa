import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { catalogService } from '@/services/catalog.service';
import { couponService } from '@/services/coupon.service';
import { authService } from '@/services/auth.service';
import { couponKeys } from './couponKeys';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { AdminCoupon } from '@/types/admin/coupons';

interface CouponCategoryPickerProps {
  coupon: AdminCoupon;
}

interface ResourceItem {
  id: string | number;
  slug?: string;
  name?: string;
  title?: string;
  [key: string]: unknown;
}

export default function CouponCategoryPicker({ coupon }: CouponCategoryPickerProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const { data, isPending, isError } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => catalogService.adminCategoriesList(),
  });

  const addMutation = useMutation({
    mutationFn: (ids: string[]) => {
      const promises = ids.map((id) =>
        couponService.adminAddCategoryToCoupon(coupon.id, {
          category: id,
          discount_type: coupon.discount_type,
          discount_value: Number(coupon.discount_value),
        })
      );
      return Promise.all(promises);
    },
    onSuccess: async () => {
      await authService.clearCache();
      queryClient.invalidateQueries({ queryKey: couponKeys.detail(coupon.id) });
      toast.success('Categories added');
      setSelected([]);
    },
    onError: () => toast.error('Failed to add categories'),
  });

  const categories = Array.isArray(data) ? data : data?.results ?? [];

  const filteredCategories = categories.filter((c: ResourceItem) => {
    if (!search) return true;
    const name = c.name || c.title || '';
    return name.toLowerCase().includes(search.toLowerCase());
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
      <h3 className="text-lg font-medium">Add Categories</h3>
      <div className="flex gap-2">
        <Input
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={handleAdd} disabled={selected.length === 0 || addMutation.isPending}>
          {addMutation.isPending ? 'Adding...' : 'Add Selected'}
        </Button>
      </div>

      <div className="border rounded-md max-h-64 overflow-y-auto p-4 space-y-2">
        {isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : isError ? (
          <p className="text-destructive">Failed to load categories.</p>
        ) : filteredCategories.length === 0 ? (
          <p className="text-muted-foreground">No categories found.</p>
        ) : (
          filteredCategories.map((c: ResourceItem) => (
            <div key={c.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`category-${c.id}`}
                checked={selected.includes(c.id.toString())}
                onChange={() => handleToggle(c.id.toString())}
                className="w-4 h-4"
              />
              <label htmlFor={`category-${c.id}`} className="text-sm">
                {c.name || c.title || c.slug || c.id}
              </label>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
