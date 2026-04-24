import { AdminCoupon } from '@/types/admin/coupons';
import CouponStatusBadge from './CouponStatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableRow, TableCell } from '@/components/ui/table';
import { Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

interface CouponTableRowProps {
  coupon: AdminCoupon;
  onEdit: (coupon: AdminCoupon) => void;
  onDelete: (coupon: AdminCoupon) => void;
  onToggle: (coupon: AdminCoupon) => void;
  isToggling: boolean;
}

export default function CouponTableRow({
  coupon,
  onEdit,
  onDelete,
  onToggle,
  isToggling,
}: CouponTableRowProps) {
  const discountDisplay =
    coupon.discount_type === 'percent'
      ? `${Number(coupon.discount_value).toFixed(2)}%`
      : `$${Number(coupon.discount_value).toFixed(2)}`;

  return (
    <TableRow>
      <TableCell className="font-mono">{coupon.code}</TableCell>
      <TableCell>
        <Badge variant="outline" className="capitalize">
          {coupon.scope}
        </Badge>
      </TableCell>
      <TableCell>{discountDisplay}</TableCell>
      <TableCell>{new Date(coupon.start_at).toLocaleDateString()}</TableCell>
      <TableCell>{new Date(coupon.end_at).toLocaleDateString()}</TableCell>
      <TableCell>
        <CouponStatusBadge coupon={coupon} />
      </TableCell>
      <TableCell className="text-center">{coupon.used_count}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(coupon)}
            title="Edit Coupon"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggle(coupon)}
            disabled={isToggling}
            title={coupon.is_active ? 'Deactivate' : 'Activate'}
          >
            {coupon.is_active ? (
              <ToggleRight className="h-4 w-4 text-success" />
            ) : (
              <ToggleLeft className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(coupon)}
            title="Delete Coupon"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
