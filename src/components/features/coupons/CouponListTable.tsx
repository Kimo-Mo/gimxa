import { AdminCoupon } from '@/types/admin/coupons';
import { computeCouponStatus } from '@/lib/utils/coupon-status';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Tag } from 'lucide-react';
import CouponTableRow from './CouponTableRow';

interface CouponListTableProps {
  coupons: AdminCoupon[];
  isLoading: boolean;
  filter: string;
  onEdit: (c: AdminCoupon) => void;
  onDelete: (c: AdminCoupon) => void;
  onToggle: (c: AdminCoupon) => void;
  togglingId: number | null;
}

export default function CouponListTable({
  coupons,
  isLoading,
  filter,
  onEdit,
  onDelete,
  onToggle,
  togglingId,
}: CouponListTableProps) {
  const filteredCoupons = coupons.filter((c) => {
    if (filter === 'all') return true;
    const status = computeCouponStatus(c);
    if (filter === 'active') return status === 'active';
    if (filter === 'inactive') return status === 'inactive';
    if (filter === 'upcoming') return status === 'upcoming';
    if (filter === 'expired') return status === 'expired';
    return true;
  });

  return (
    <div className="rounded-md overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Scope</TableHead>
            <TableHead>Discount</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-37.5">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 7 }).map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : filteredCoupons.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <Tag className="mb-2 h-8 w-8 opacity-20" />
                  <p>No coupons found.</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filteredCoupons.map((coupon) => (
              <CouponTableRow
                key={coupon.id}
                coupon={coupon}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggle={onToggle}
                isToggling={togglingId === coupon.id}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
