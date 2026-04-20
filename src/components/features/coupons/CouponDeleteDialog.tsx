import { useMutation, useQueryClient } from '@tanstack/react-query';
import { couponService } from '@/services/coupon.service';
import { authService } from '@/services/auth.service';
import { couponKeys } from './couponKeys';
import { toast } from 'sonner';
import { AdminCoupon } from '@/types/admin/coupons';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CouponDeleteDialogProps {
  coupon: AdminCoupon | null;
  onClose: () => void;
}

export default function CouponDeleteDialog({ coupon, onClose }: CouponDeleteDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number | string) => couponService.adminDeleteCoupon(id),
    onSuccess: async () => {
      await authService.clearCache();
      queryClient.invalidateQueries({ queryKey: couponKeys.all });
      toast.success('Coupon deleted');
      onClose();
    },
    onError: () => toast.error('Failed to delete coupon'),
  });

  return (
    <AlertDialog
      open={!!coupon}
      onOpenChange={(open) => {
        if (!open) {
          mutation.reset();
          onClose();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the coupon &quot;
            {coupon?.code}
            &quot;.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              if (coupon) mutation.mutate(coupon.id);
            }}
            disabled={mutation.isPending}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            {mutation.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
