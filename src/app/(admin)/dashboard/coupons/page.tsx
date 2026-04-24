'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { couponService } from '@/services/coupon.service';
import { authService } from '@/services/auth.service';
import { couponKeys } from '@/components/features/coupons/couponKeys';
import { AdminCoupon, AdminCouponPayload } from '@/types/admin/coupons';
import CouponListTable from '@/components/features/coupons/CouponListTable';
import CouponCreateDialog from '@/components/features/coupons/CouponCreateDialog';
import CouponDeleteDialog from '@/components/features/coupons/CouponDeleteDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminCouponsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [createOpen, setCreateOpen] = useState<boolean>(false);
  const [deleteCoupon, setDeleteCoupon] = useState<AdminCoupon | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const tabs = [
    { value: 'all', label: 'All Coupons' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'expired', label: 'Expired' },
  ];

  const { data, isPending } = useQuery({
    queryKey: couponKeys.all,
    queryFn: () => couponService.adminCouponsList(),
  });

  // Depending on how backend paginates or returns list
  const coupons: AdminCoupon[] = Array.isArray(data) ? data : data?.results ?? [];

  const toggleMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AdminCouponPayload }) =>
      couponService.adminUpdateCoupon(id, payload),
    onMutate: ({ id }) => setTogglingId(id),
    onSuccess: async () => {
      await authService.clearCache();
      queryClient.invalidateQueries({ queryKey: couponKeys.all });
      toast.success('Status updated');
    },
    onError: () => {
      toast.error('Failed to update status');
    },
    onSettled: () => {
      setTogglingId(null);
    },
  });

  const handleToggle = (coupon: AdminCoupon) => {
    const cachedCoupons = queryClient.getQueryData<AdminCoupon[]>(couponKeys.all) ?? [];
    // If backend uses pagination, cachedCoupons might be { results: AdminCoupon[] }. Let's find it safely.
    let found = undefined;
    if (Array.isArray(cachedCoupons)) {
      found = cachedCoupons.find((c) => c.id === coupon.id);
    } else {
      const resp = cachedCoupons as unknown as { results: AdminCoupon[] };
      found = resp?.results?.find((c) => c.id === coupon.id);
    }

    // Fallback to the argument object if not in cache (though it should be)
    const targetCoupon = found || coupon;
    
    // We must send the whole payload
    const payload: AdminCouponPayload = {
      code: targetCoupon.code,
      scope: targetCoupon.scope,
      discount_type: targetCoupon.discount_type,
      discount_value: targetCoupon.discount_value,
      start_at: targetCoupon.start_at,
      end_at: targetCoupon.end_at,
      max_usage: targetCoupon.max_usage,
      is_active: !targetCoupon.is_active,
    };

    toggleMutation.mutate({ id: targetCoupon.id, payload });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Coupon Management</h1>
          <p className="text-muted-foreground mt-1">Review and manage discount coupons.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Coupon
        </Button>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle className="text-foreground">Coupons</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-full sm:w-48 bg-background border-border h-9 text-sm">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {tabs.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search coupons..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-background border-border h-9 text-sm"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CouponListTable
            coupons={coupons.filter(c => c.code.toLowerCase().includes(search.toLowerCase()))}
            isLoading={isPending}
            filter={filter}
            onEdit={(c) => router.push(`/dashboard/coupons/${c.id}/edit`)}
            onDelete={setDeleteCoupon}
            onToggle={handleToggle}
            togglingId={togglingId}
          />
        </CardContent>
      </Card>

      <CouponCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
      <CouponDeleteDialog coupon={deleteCoupon} onClose={() => setDeleteCoupon(null)} />
    </div>
  );
}
