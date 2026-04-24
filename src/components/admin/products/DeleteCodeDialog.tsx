import { AdminCode } from '@/types/admin/codes';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface DeleteCodeDialogProps {
  code: AdminCode | null;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function DeleteCodeDialog({
  code,
  onClose,
  onConfirm,
  isPending,
}: DeleteCodeDialogProps) {
  return (
    <Dialog open={code !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Delete Code</DialogTitle>
          <DialogDescription>
            This action is permanent and cannot be undone. The code will be removed from the system.
          </DialogDescription>
        </DialogHeader>
        {code && (
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Code: <span className="font-mono text-foreground">{code.code}</span>
            </p>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending} className="gap-2">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
