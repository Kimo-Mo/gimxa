import { AdminNotification } from '@/types/admin/notifications';
import { Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableRow, TableCell } from '@/components/ui/table';

interface NotificationRowProps {
  notification: AdminNotification;
  onView: (id: number) => void;
  onDelete: (id: number) => void;
}

export function NotificationRow({ notification, onView, onDelete }: NotificationRowProps) {
  const recipientDisplay =
    notification.user?.full_name || notification.user?.email || notification.user?.username || '—';

  return (
    <TableRow>
      <TableCell className="font-medium text-foreground text-sm max-w-40 truncate">
        {notification.subject}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm max-w-60 truncate">
        {notification.message}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">{recipientDisplay}</TableCell>
      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
        {new Date(notification.created_at).toLocaleString()}
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onView(notification.id)}>
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(notification.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
