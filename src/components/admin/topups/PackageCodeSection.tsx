'use client';

import { usePackageCodesQuery } from '@/hooks/admin/usePackageCodesQuery';
import { Button } from '@/components/ui/button';
import { CodeInventoryTable } from '../products/CodeInventoryTable';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

export function PackageCodeSection({ slug, packageId }: { slug: string; packageId: number }) {
  const { data, isPending, isError, refetch } = usePackageCodesQuery(slug, packageId);

  return (
    <div className="space-y-4 border-t border-border pt-4 mt-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Code Inventory</span>
        {isPending && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        {isError && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">—</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="text-xs text-primary hover:underline h-auto p-0"
            >
              Retry
            </Button>
          </div>
        )}
        {data && (
          <Badge className="bg-success/20 text-success border-none font-medium">
            {data.available_codes} available
          </Badge>
        )}
      </div>

      {data && data.codes.length > 0 && (
        <CodeInventoryTable codes={data.codes} slug={slug} />
      )}
      {data && data.codes.length === 0 && (
        <p className="text-xs text-muted-foreground">No codes found for this package.</p>
      )}
    </div>
  );
}
