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

interface DeleteTopupDialogProps {
  deleteSlug: string | null;
  setDeleteSlug: (s: string | null) => void;
  deleting: boolean;
  handleDelete: () => void;
}

export function DeleteTopupDialog({
  deleteSlug,
  setDeleteSlug,
  deleting,
  handleDelete,
}: DeleteTopupDialogProps) {
  return (
    <AlertDialog
      open={!!deleteSlug}
      onOpenChange={(open) => {
        if (!open) setDeleteSlug(null);
      }}>
      <AlertDialogContent className="bg-card border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground">Delete Top Up Game?</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            This will permanently delete this top up game along with all its fields and packages.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-border" disabled={deleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-destructive hover:bg-destructive/90 text-white">
            {deleting ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
