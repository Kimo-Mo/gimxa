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

interface DeleteConfirmDialogProps {
  deleteTarget: { type: 'field' | 'package'; id: number } | null;
  setDeleteTarget: (target: null) => void;
  deleting: boolean;
  onConfirm: () => void;
}

export function DeleteConfirmDialog({
  deleteTarget,
  setDeleteTarget,
  deleting,
  onConfirm,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog
      open={!!deleteTarget}
      onOpenChange={(open) => {
        if (!open) setDeleteTarget(null);
      }}>
      <AlertDialogContent className="bg-card border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground text-base capitalize">
            Delete {deleteTarget?.type}?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground text-sm">
            This will permanently delete this {deleteTarget?.type}. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-border text-xs h-8" disabled={deleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={deleting}
            className="bg-destructive hover:bg-destructive/90 text-white text-xs h-8">
            {deleting ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
