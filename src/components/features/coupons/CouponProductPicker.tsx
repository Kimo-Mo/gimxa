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

interface CouponProductPickerProps {
  coupon: AdminCoupon;
}

interface ResourceItem {
  id: string | number;
  slug?: string;
  name?: string;
  title?: string;
  [key: string]: unknown;
}

export default function CouponProductPicker({ coupon }: CouponProductPickerProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const { data, isPending, isError } = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: () => catalogService.adminProductsList(),
  });

  const addMutation = useMutation({
    mutationFn: (ids: string[]) => {
      const promises = ids.map((id) =>
        couponService.adminAddProductsToCoupon(coupon.id, {
          product: id,
          discount_type: coupon.discount_type,
          discount_value: Number(coupon.discount_value),
        })
      );
      return Promise.all(promises);
    },
    onSuccess: async () => {
      await authService.clearCache();
      queryClient.invalidateQueries({ queryKey: couponKeys.detail(coupon.id) });
      toast.success('Products added');
      setSelected([]);
    },
    onError: () => toast.error('Failed to add products'),
  });

  const products = Array.isArray(data) ? data : data?.results ?? [];

  const filteredProducts = products.filter((p: ResourceItem) => {
    if (!search) return true;
    const name = p.name || p.title || '';
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
      <h3 className="text-lg font-medium">Add Products</h3>
      <div className="flex gap-2">
        <Input
          placeholder="Search products..."
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
          <p className="text-destructive">Failed to load products.</p>
        ) : filteredProducts.length === 0 ? (
          <p className="text-muted-foreground">No products found.</p>
        ) : (
          filteredProducts.map((p: ResourceItem) => (
            <div key={p.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`product-${p.id}`}
                checked={selected.includes(p.id.toString())}
                onChange={() => handleToggle(p.id.toString())}
                className="w-4 h-4"
              />
              <label htmlFor={`product-${p.id}`} className="text-sm">
                {p.name || p.title || p.slug || p.id}
              </label>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
