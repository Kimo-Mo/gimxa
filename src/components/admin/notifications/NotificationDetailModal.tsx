import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAdminNotificationDetailQuery } from '@/hooks/admin/useAdminNotificationDetailQuery';

interface NotificationDetailModalProps {
  id: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationDetailModal({ id, open, onOpenChange }: NotificationDetailModalProps) {
  const { data, isLoading, isError } = useAdminNotificationDetailQuery(id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="" className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Notification Details</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          )}

          {isError && (
            <p className="text-destructive text-sm">
              Failed to load notification details. Please try again.
            </p>
          )}

          {data && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Subject</h4>
                <p className="text-sm mt-1">{data.subject}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Message</h4>
                <div className="bg-muted p-3 mt-1 rounded-md max-h-60 overflow-y-auto">
                  <p className="text-sm whitespace-pre-wrap">{data.message}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Recipient</h4>
                  <p className="text-sm mt-1">
                    {data.user
                      ? `${data.user.full_name || data.user.username} (${data.user.email})`
                      : '—'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Email Type</h4>
                  <div className="mt-1">
                    <Badge variant="secondary">{data.email_type}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Read</h4>
                  <p className="text-sm mt-1">
                    {data.is_read
                      ? `Yes${data.readed_at ? ` at ${new Date(data.readed_at).toLocaleString()}` : ''}`
                      : 'No'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Emailed</h4>
                  <p className="text-sm mt-1">
                    {data.emailed_at ? `Yes — ${new Date(data.emailed_at).toLocaleString()}` : 'No'}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Sent At</h4>
                <p className="text-sm mt-1">{new Date(data.created_at).toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
