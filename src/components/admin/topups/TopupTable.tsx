import Image from 'next/image';
import Link from 'next/link';
import { MoreHorizontal, Pencil, Trash2, Zap } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { AdminTopupGame } from '@/types/admin/topups';
import { getImageUrl } from '@/lib/utils';

interface TopupTableProps {
  topups: AdminTopupGame[];
  loading: boolean;
  error: string | null;
  setDeleteSlug: (s: string | null) => void;
}

function TableRowSkeleton() {
  return (
    <TableRow className="border-border">
      <TableCell>
        <Skeleton className="w-12 h-12 rounded" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-40" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-12" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-12" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-8" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-8 w-8 rounded ml-auto" />
      </TableCell>
    </TableRow>
  );
}

export function TopupTable({ topups, loading, error, setDeleteSlug }: TopupTableProps) {
  if (error) {
    return <div className="text-center py-12 text-destructive text-sm">{error}</div>;
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground font-medium w-16">Logo</TableHead>
            <TableHead className="text-muted-foreground font-medium min-w-48">Game Name</TableHead>
            <TableHead className="text-muted-foreground font-medium">Category</TableHead>
            <TableHead className="text-muted-foreground font-medium">Status</TableHead>
            <TableHead className="text-muted-foreground font-medium">Available</TableHead>
            <TableHead className="text-right text-muted-foreground font-medium">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} />)
          ) : topups.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Zap className="h-10 w-10 opacity-30" />
                  <span className="text-sm">No top-up games found.</span>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            topups.map((topup) => (
              <TableRow key={topup.id} className="border-border hover:bg-muted/50">
                <TableCell>
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center border border-border overflow-hidden">
                    {topup.logo || topup.product?.main_image?.image ? (
                      <Image
                        src={getImageUrl(topup.logo ?? topup.product!.main_image!.image)}
                        alt={topup.product?.name ?? 'topup'}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                        unoptimized
                      />
                    ) : (
                      <Zap className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-foreground text-sm">
                    {topup.product?.name ?? `TopUp #${topup.id}`}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="text-xs border-border text-muted-foreground capitalize">
                    {topup.product?.categories && topup.product.categories.length > 0
                      ? topup.product.categories[0].name
                      : 'Uncategorized'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {topup.is_active ? (
                    <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 shadow-none border-0 font-medium">
                      Active
                    </Badge>
                  ) : (
                    <Badge className="bg-muted/50 text-muted-foreground hover:bg-muted/80 shadow-none border-0 font-medium">
                      Inactive
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {topup.product?.is_available ? (
                    <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 shadow-none border-0 font-medium">
                      Available
                    </Badge>
                  ) : (
                    <Badge className="bg-destructive/10 text-destructive border-transparent shadow-none hover:bg-destructive/20 font-medium">
                      Unavailable
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground hover:bg-accent h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border-border">
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/dashboard/topups/${topup.product?.slug ?? topup.id}`}
                          className="flex items-center gap-2 cursor-pointer">
                          <Pencil className="h-4 w-4" /> Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive flex items-center gap-2 cursor-pointer"
                        onClick={() => setDeleteSlug(topup.product?.slug ?? null)}>
                        <Trash2 className="h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
