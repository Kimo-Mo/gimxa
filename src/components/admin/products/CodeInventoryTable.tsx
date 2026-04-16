'use client';

import { useState } from 'react';
import { AdminCode } from '@/types/admin/codes';
import { useInvalidateCodeMutation, useDeleteCodeMutation } from '@/hooks/admin/useCodeMutations';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Key, Trash2 } from 'lucide-react';
import { InvalidateCodeDialog } from './InvalidateCodeDialog';
import { DeleteCodeDialog } from './DeleteCodeDialog';

interface CodeInventoryTableProps {
  codes: AdminCode[];
  slug: string;
}

export function CodeInventoryTable({ codes, slug }: CodeInventoryTableProps) {
  const [invalidateTarget, setInvalidateTarget] = useState<AdminCode | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCode | null>(null);

  const invalidateMutation = useInvalidateCodeMutation(slug);
  const deleteMutation = useDeleteCodeMutation(slug);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {codes.map((code) => (
            <TableRow key={code.id}>
              <TableCell className="text-muted-foreground">{code.id}</TableCell>
              <TableCell className="font-mono">{code.code}</TableCell>
              <TableCell>
                {code.is_used ? (
                  <Badge className="bg-destructive/20 text-destructive border-none font-medium">Used</Badge>
                ) : (
                  <Badge className="bg-success/20 text-success border-none font-medium">Available</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                {!code.is_used && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setInvalidateTarget(code)}
                    title="Invalidate code"
                  >
                    <Key className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setDeleteTarget(code)}
                  title="Delete code"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <InvalidateCodeDialog
        key={invalidateTarget?.id ?? 'none'}
        code={invalidateTarget}
        onClose={() => setInvalidateTarget(null)}
        isPending={invalidateMutation.isPending}
        onConfirm={(editedCode) => {
          if (!invalidateTarget) return;
          invalidateMutation.mutate(
            { id: invalidateTarget.id, payload: { is_used: true, code: editedCode } },
            { onSuccess: () => setInvalidateTarget(null) }
          );
        }}
      />

      <DeleteCodeDialog
        code={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
        }}
      />
    </div>
  );
}
