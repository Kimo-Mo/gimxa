import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { couponService } from '@/services/coupon.service';
import { authService } from '@/services/auth.service';
import { couponKeys } from './couponKeys';
import { toast } from 'sonner';
import { AdminCoupon } from '@/types/admin/coupons';
import CouponProductPicker from './CouponProductPicker';
import CouponCategoryPicker from './CouponCategoryPicker';
import CouponPackagePicker from './CouponPackagePicker';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface CouponScopingTabProps {
  coupon: AdminCoupon;
}

interface ResourceItem {
  id: string | number;
  slug?: string;
  name?: string;
  title?: string;
  product?: string | number;
  category?: string | number;
  package?: string | number;
  product_name?: string;
  category_name?: string;
  package_name?: string;
  discount_value?: string | number;
  discount_type?: string;
}

export default function CouponScopingTab({ coupon }: CouponScopingTabProps) {
  const queryClient = useQueryClient();

  const { data, isPending, isError } = useQuery({
    queryKey: couponKeys.detail(coupon.id),
    queryFn: () => couponService.adminGetCouponDetail(coupon.id),
  });

  const removeProductMutation = useMutation({
    mutationFn: (productId: string | number) => couponService.adminDeleteProductFromCoupon(coupon.id, productId),
    onSuccess: async () => {
      await authService.clearCache();
      queryClient.invalidateQueries({ queryKey: couponKeys.detail(coupon.id) });
      toast.success('Product removed');
    },
    onError: () => toast.error('Failed to remove product'),
  });

  const removeCategoryMutation = useMutation({
    mutationFn: (categoryId: string | number) => couponService.adminDeleteCategoryFromCoupon(coupon.id, categoryId),
    onSuccess: async () => {
      await authService.clearCache();
      queryClient.invalidateQueries({ queryKey: couponKeys.detail(coupon.id) });
      toast.success('Category removed');
    },
    onError: () => toast.error('Failed to remove category'),
  });

  const removePackageMutation = useMutation({
    mutationFn: (packageId: string | number) => couponService.adminDeletePackageFromCoupon(coupon.id, packageId),
    onSuccess: async () => {
      await authService.clearCache();
      queryClient.invalidateQueries({ queryKey: couponKeys.detail(coupon.id) });
      toast.success('Package removed');
    },
    onError: () => toast.error('Failed to remove package'),
  });

  if (coupon.scope === 'global') {
    return (
      <div className="bg-card p-6 rounded-lg border">
        <p>Global coupons apply to all orders. No resource restrictions.</p>
      </div>
    );
  }



  const renderPicker = () => {
    switch (coupon.scope) {
      case 'product':
        return <CouponProductPicker coupon={coupon} />;
      case 'category':
        return <CouponCategoryPicker coupon={coupon} />;
      case 'package':
        return <CouponPackagePicker coupon={coupon} />;
      default:
        return null;
    }
  };

  const renderAttached = () => {
    if (isPending) {
      return <Skeleton className="h-24 w-full" />;
    }

    if (isError || !data) {
      return <p className="text-destructive">Failed to load attached resources.</p>;
    }

    const detailCoupon = (data as Record<string, ResourceItem[]>) || {};
    let list: ResourceItem[] = [];
    let onRemove: (id: string | number) => void = () => {};
    let isRemoving = false;

    if (coupon.scope === 'product') {
      list = detailCoupon.product_discounts || detailCoupon.products || [];
      onRemove = (productId) => removeProductMutation.mutate(productId);
      isRemoving = removeProductMutation.isPending;
    } else if (coupon.scope === 'category') {
      list = detailCoupon.category_discounts || detailCoupon.categories || [];
      onRemove = (categoryId) => removeCategoryMutation.mutate(categoryId);
      isRemoving = removeCategoryMutation.isPending;
    } else if (coupon.scope === 'package') {
      list = detailCoupon.package_discounts || detailCoupon.packages || [];
      onRemove = (pkgId) => removePackageMutation.mutate(pkgId);
      isRemoving = removePackageMutation.isPending;
    }

    if (list.length === 0) {
      return <p className="text-muted-foreground text-sm">No resources attached yet.</p>;
    }

    return (
      <ul className="space-y-2">
        {list.map((item) => (
          <li
            key={item.id as React.Key}
            className="flex items-center justify-between p-2 border rounded-md">
            <span>
              {String(
                item.product_name || item.category_name || item.package_name || item.id
              )}
            </span>
            <span className="text-sm text-muted-foreground">
              Discount: {String(item.discount_value)} ({String(item.discount_type)})
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              disabled={isRemoving}
              onClick={() => {
                let resourceId = item.id;
                if (coupon.scope === 'product' && item.product) resourceId = item.product;
                if (coupon.scope === 'category' && item.category) resourceId = item.category;
                if (coupon.scope === 'package' && item.package) resourceId = item.package;
                onRemove(resourceId as string | number);
              }}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="space-y-8 bg-card p-6 rounded-lg border">
      <div>
        <h2 className="text-lg font-semibold capitalize mb-4">Scope: {coupon.scope}</h2>
        {renderPicker()}
      </div>

      <hr />

      <div>
        <h3 className="text-lg font-semibold mb-4">Currently Attached</h3>
        {renderAttached()}
      </div>
    </div>
  );
}
