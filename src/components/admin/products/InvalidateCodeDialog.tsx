import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

interface InvalidateCodeDialogProps {
  code: AdminCode | null;
  onClose: () => void;
  onConfirm: (editedCode: string) => void;
  isPending: boolean;
}

export function InvalidateCodeDialog({
  code,
  onClose,
  onConfirm,
  isPending,
}: InvalidateCodeDialogProps) {
  const [editedValue, setEditedValue] = useState(code?.code ?? '');

  return (
    <Dialog open={code !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Invalidate Code</DialogTitle>
          <DialogDescription>
            This will permanently mark the code as used. You can optionally correct the code string
            before confirming.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={editedValue}
            onChange={(e) => setEditedValue(e.target.value)}
            disabled={isPending}
            className="font-mono text-sm"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(editedValue.trim())}
            disabled={isPending}
            className="gap-2">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
