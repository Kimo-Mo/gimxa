import { useEffect, useState } from 'react';
import { Key, Trash2, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AdminCode } from '@/types/admin/codes';
import { EditCodeDialog } from './EditCodeDialog';

interface CodesTableProps {
  codes: AdminCode[];
  loading: boolean;
  error: string | null;
  selectedProduct: string;
  onDelete: (code: AdminCode) => void;
  onEdit: (code: AdminCode, nextCodeValue: string) => Promise<void>;
  getCodeDisplayName: (code: AdminCode) => string;
}

function TableRowSkeleton() {
  return (
    <TableRow className="border-border">
      <TableCell>
        <Skeleton className="h-4 w-40" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-20 rounded-full" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-8 w-8 rounded ml-auto" />
      </TableCell>
    </TableRow>
  );
}

export function CodesTable({
  codes,
  loading,
  error,
  selectedProduct,
  onDelete,
  onEdit,
  getCodeDisplayName,
}: CodesTableProps) {
  const [editTarget, setEditTarget] = useState<AdminCode | null>(null);
  const [editCodeValue, setEditCodeValue] = useState('');
  const [updating, setUpdating] = useState(false);
  useEffect(() => {
    if (!editTarget) {
      setEditCodeValue('');
      return;
    }
    setEditCodeValue(editTarget.code);
  }, [editTarget]);

  const handleSubmitEdit = async () => {
    if (!editTarget || !editCodeValue.trim()) return;
    setUpdating(true);
    try {
      await onEdit(editTarget, editCodeValue.trim());
      setEditTarget(null);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground font-medium">ID</TableHead>
            <TableHead className="text-muted-foreground font-medium">Code</TableHead>
            <TableHead className="text-muted-foreground font-medium">Status</TableHead>
            <TableHead className="text-right text-muted-foreground font-medium">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {error ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-12">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Key className="h-10 w-10 opacity-30" />
                  <span className="text-sm">
                    {selectedProduct === 'all' ? 'No codes found.' : 'No codes for this product.'}
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ) : loading || codes.length === 0 ? (
            Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} />)
          ) : (
            codes.map((code) => (
              <TableRow key={code.id} className="border-border hover:bg-muted/50">
                <TableCell className="text-muted-foreground text-sm">#{code.id}</TableCell>
                <TableCell className="font-mono text-foreground text-sm">{code.code}</TableCell>
                <TableCell>
                  {code.is_used ? (
                    <Badge className="bg-destructive/20 text-destructive hover:bg-destructive/30 border-none font-medium">
                      Used
                    </Badge>
                  ) : (
                    <Badge className="bg-success/20 text-success hover:bg-success/30 border-none font-medium">
                      Available
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
                    onClick={() => setEditTarget(code)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onDelete(code)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <EditCodeDialog
        editTarget={editTarget}
        setEditTarget={setEditTarget}
        updating={updating}
        handleSubmitEdit={handleSubmitEdit}
        editCodeValue={editCodeValue}
        setEditCodeValue={setEditCodeValue}
        getCodeDisplayName={getCodeDisplayName}
      />
    </div>
  );
}
