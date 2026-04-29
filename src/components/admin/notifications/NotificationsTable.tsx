import { AdminNotification } from '@/types/admin/notifications';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Bell, ChevronLeft, ChevronRight } from 'lucide-react';
import { NotificationsTableSkeleton } from './NotificationsTableSkeleton';
import { NotificationRow } from './NotificationRow';

interface NotificationsTableProps {
  notifications: AdminNotification[];
  isLoading: boolean;
  pagination: { count: number; total_pages: number; current_page: number };
  page: number;
  onPageChange: (page: number) => void;
  onView: (id: number) => void;
  onDelete: (id: number) => void;
}

export function NotificationsTable({
  notifications,
  isLoading,
  pagination,
  page,
  onPageChange,
  onView,
  onDelete,
}: NotificationsTableProps) {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Sent At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <NotificationsTableSkeleton />
            ) : notifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                    <Bell className="h-10 w-10 opacity-30 mb-2" />
                    <span>No notifications sent yet.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              notifications.map((n) => (
                <NotificationRow key={n.id} notification={n} onView={onView} onDelete={onDelete} />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.current_page} of {pagination.total_pages}
          </p>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= pagination.total_pages}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
