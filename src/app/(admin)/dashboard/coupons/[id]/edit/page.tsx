'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { couponService } from '@/services/coupon.service';
import { couponKeys } from '@/components/features/coupons/couponKeys';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import CouponEditForm from '@/components/features/coupons/CouponEditForm';
import CouponScopingTab from '@/components/features/coupons/CouponScopingTab';
import { AdminCoupon } from '@/types/admin/coupons';
import { Button } from '@/components/ui';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function EditCouponPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isPending, isError } = useQuery({
    queryKey: couponKeys.detail(id),
    queryFn: () => couponService.adminGetCouponDetail(id),
    enabled: !!id,
  });

  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-100 w-full max-w-2xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6 bg-destructive/10 text-destructive rounded-md">
        Failed to load coupon details. Provide a valid ID.
      </div>
    );
  }

  const coupon = data as AdminCoupon;

  return (
    <div className="space-y-6">
      <div className='flex items-center gap-4'>
        <Link href="/dashboard/coupons">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Edit Coupon: {coupon.code}</h1>
      </div>
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          {coupon.scope !== 'global' && (
            <TabsTrigger value="scope">Scoping</TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="details">
          <CouponEditForm coupon={coupon} />
        </TabsContent>
        <TabsContent value="scope">
          <CouponScopingTab coupon={coupon} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
