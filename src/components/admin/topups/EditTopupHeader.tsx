import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EditTopupHeaderProps {
  title: string;
}

export function EditTopupHeader({ title }: EditTopupHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <Link href="/dashboard/topups">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </Link>
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="text-muted-foreground mt-1">
          Manage fields and packages for this top up game.
        </p>
      </div>
    </div>
  );
}
