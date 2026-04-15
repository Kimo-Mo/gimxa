import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function TopupListHeader() {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Top-Up Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage direct top-up games, fields, and packages.
        </p>
      </div>
      <Link href="/dashboard/topups/create">
        <Button className="bg-primary hover:bg-primary-hover text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" /> Add Top-Up
        </Button>
      </Link>
    </div>
  );
}
