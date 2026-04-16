'use client';

import { useProductCodesQuery } from '@/hooks/admin/useProductCodesQuery';
import { CodeSummaryHeader } from './CodeSummaryHeader';
import { CodeInventoryTable } from './CodeInventoryTable';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function ProductCodeInventory({ slug }: { slug: string }) {
  const { data, isPending, isError, refetch } = useProductCodesQuery(slug);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Code Inventory</CardTitle>
        {data && <CodeSummaryHeader totalCodes={data.total_codes} availableCodes={data.available_codes} />}
      </CardHeader>
      <CardContent className="space-y-4">
        {isPending && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        )}

        {isError && (
          <div className="text-center py-4">
            <p className="text-destructive mb-2">Failed to load codes.</p>
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        )}

        {data && data.codes.length === 0 && (
          <p className="text-muted-foreground py-4">No codes yet. Add some below.</p>
        )}

        {data && data.codes.length > 0 && (
          <CodeInventoryTable codes={data.codes} slug={slug} />
        )}
      </CardContent>
    </Card>
  );
}
