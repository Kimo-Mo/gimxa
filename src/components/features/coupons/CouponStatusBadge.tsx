import { AdminCoupon } from '@/types/admin/coupons';
import { Badge } from '@/components/ui/badge';
import { computeCouponStatus } from '@/lib/utils/coupon-status';

interface CouponStatusBadgeProps {
  coupon: AdminCoupon;
}

export default function CouponStatusBadge({ coupon }: CouponStatusBadgeProps) {
  const status = computeCouponStatus(coupon);

  switch (status) {
    case 'active':
      return <Badge className="bg-success/20 text-success border-none font-medium">Active</Badge>;
    case 'upcoming':
      return <Badge className="bg-blue-500/20 text-blue-400 border-none font-medium">Upcoming</Badge>;
    case 'expired':
      return <Badge className="bg-destructive/20 text-destructive border-none font-medium">Expired</Badge>;
    case 'inactive':
      return <Badge className="bg-muted/60 text-muted-foreground border-none font-medium">Inactive</Badge>;
    default:
      return null;
  }
}
