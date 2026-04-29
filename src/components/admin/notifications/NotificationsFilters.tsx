import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { CardTitle } from '@/components/ui';

interface NotificationsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  isRead: boolean | undefined;
  onIsReadChange: (value: boolean | undefined) => void;
  isEmailed: boolean | undefined;
  onIsEmailedChange: (value: boolean | undefined) => void;
}

export function NotificationsFilters({
  search,
  onSearchChange,
  isRead,
  onIsReadChange,
  isEmailed,
  onIsEmailedChange,
}: NotificationsFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
      <CardTitle className="text-foreground">Notifications</CardTitle>
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notifications…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 max-w-xs"
          />
        </div>
        <Button
          variant={isRead === false ? 'default' : 'outline'}
          size="sm"
          onClick={() => onIsReadChange(isRead === false ? undefined : false)}>
          Unread Only
        </Button>
        <Button
          variant={isEmailed === false ? 'default' : 'outline'}
          size="sm"
          onClick={() => onIsEmailedChange(isEmailed === false ? undefined : false)}>
          Not Emailed
        </Button>
      </div>
    </div>
  );
}
