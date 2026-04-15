import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AdminCode } from '@/types/admin/codes';
import { Dispatch, SetStateAction } from 'react';
interface EditCodeDialogProps {
  editTarget: AdminCode | null;
  setEditTarget: Dispatch<SetStateAction<AdminCode | null>>;
  editCodeValue: string;
  setEditCodeValue: React.Dispatch<React.SetStateAction<string>>;
  updating: boolean;
  handleSubmitEdit: () => void;
  getCodeDisplayName: (code: AdminCode) => string;
}
export function EditCodeDialog({
  editTarget,
  setEditTarget,
  editCodeValue,
  setEditCodeValue,
  updating,
  handleSubmitEdit,
  getCodeDisplayName,
}: EditCodeDialogProps) {
  return (
    <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Edit Code</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {editTarget ? getCodeDisplayName(editTarget) : ''}
          </DialogDescription>
        </DialogHeader>
        <Input
          value={editCodeValue}
          onChange={(e) => setEditCodeValue(e.target.value)}
          className="bg-background border-border font-mono"
          disabled={updating}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditTarget(null)} disabled={updating}>
            Cancel
          </Button>
          <Button onClick={handleSubmitEdit} disabled={updating || !editCodeValue.trim()}>
            {updating ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
