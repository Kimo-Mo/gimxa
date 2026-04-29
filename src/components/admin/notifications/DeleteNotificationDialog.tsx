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
import { useDeleteNotificationMutation } from '@/hooks/admin/useAdminNotificationMutations';

interface DeleteNotificationDialogProps {
  id: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteNotificationDialog({
  id,
  open,
  onOpenChange,
}: DeleteNotificationDialogProps) {
  const { mutate, isPending } = useDeleteNotificationMutation();

  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    if (id) {
      mutate(id, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card border-border">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Notification?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this notification. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-destructive hover:bg-destructive/90 text-white">
            {isPending ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
