'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Bell, Trash2, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import { notificationService } from '@/services/notification.service';
import type { AdminNotification } from '@/types/admin/notifications';
import type { PaginatedResponse } from '@/types/common';
import { toast } from 'sonner';

const PAGE_SIZE = 10;

function TableRowSkeleton() {
  return (
    <TableRow className="border-border">
      <TableCell>
        <Skeleton className="h-4 w-40" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-64" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-8 w-8 rounded ml-auto" />
      </TableCell>
    </TableRow>
  );
}

const emptyForm = { title: '', message: '', user_id: '' };

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [pagination, setPagination] = useState({ count: 0, total_pages: 1, current_page: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = (await notificationService.adminNotificationsList({
        page,
        limit: PAGE_SIZE,
      })) as PaginatedResponse<AdminNotification>;
      const results = Array.isArray(data) ? data : (data?.results ?? []);
      setNotifications(results);
      setPagination({
        count: (data as PaginatedResponse<AdminNotification>)?.count ?? results.length,
        total_pages: (data as PaginatedResponse<AdminNotification>)?.total_pages ?? 1,
        current_page: (data as PaginatedResponse<AdminNotification>)?.current_page ?? 1,
      });
    } catch {
      setError('Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Title and message are required.');
      return;
    }
    setSending(true);
    try {
      await notificationService.adminSendNotification({
        subject: form.title,
        message: form.message,
        email_type: 'default',
        ...(form.user_id.trim() ? { user: form.user_id.trim() } : {}),
      });
      toast.success(form.user_id ? 'Notification sent to user.' : 'Broadcast sent to all users.');
      setFormOpen(false);
      setForm(emptyForm);
      fetchNotifications();
    } catch {
      toast.error('Failed to send notification.');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await notificationService.adminDeleteNotification(deleteId);
      toast.success('Notification deleted.');
      fetchNotifications();
    } catch {
      toast.error('Failed to delete notification.');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">Send and manage user notifications.</p>
        </div>
        <Button
          onClick={() => {
            setForm(emptyForm);
            setFormOpen(true);
          }}
          className="bg-primary hover:bg-primary-hover text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" /> Send Notification
        </Button>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-foreground">
            Sent Notifications{' '}
            {pagination.count > 0 && (
              <span className="text-muted-foreground font-normal text-sm ml-1">
                ({pagination.count})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-12 text-destructive text-sm">{error}</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground font-medium">Subject</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Message</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Recipient</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Sent At</TableHead>
                      <TableHead className="text-right text-muted-foreground font-medium">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} />)
                    ) : notifications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Bell className="h-10 w-10 opacity-30" />
                            <span className="text-sm">No notifications sent yet.</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      notifications.map((n) => (
                        <TableRow key={n.id} className="border-border hover:bg-muted/50">
                          <TableCell className="font-medium text-foreground text-sm max-w-40 truncate">
                            {n.subject}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm max-w-60 truncate">
                            {n.message}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {n.user?.full_name || n.user?.email || n.user?.username || (
                              <span className="text-primary text-xs font-medium">All users</span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(n.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteId(String(n.id))}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {pagination.total_pages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.current_page} of {pagination.total_pages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1 || loading}
                      className="border-border h-8">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
                      disabled={page >= pagination.total_pages || loading}
                      className="border-border h-8">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Send Notification Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent aria-describedby={undefined} className="bg-card border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">Send Notification</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Leave &quot;User ID&quot; empty to broadcast to all users.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="notif-title" className="text-foreground text-sm">
                Title *
              </Label>
              <Input
                id="notif-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Notification title"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notif-message" className="text-foreground text-sm">
                Message *
              </Label>
              <Textarea
                id="notif-message"
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="Notification message body…"
                rows={4}
                className="bg-background border-border resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notif-user" className="text-foreground text-sm">
                User ID{' '}
                <span className="text-muted-foreground">
                  (optional — leave empty for broadcast)
                </span>
              </Label>
              <Input
                id="notif-user"
                value={form.user_id}
                onChange={(e) => setForm((f) => ({ ...f, user_id: e.target.value }))}
                placeholder="e.g. abc123def456"
                className="bg-background border-border font-mono text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                className="border-border"
                onClick={() => setFormOpen(false)}
                disabled={sending}>
                Cancel
              </Button>
              <Button
                className="bg-primary hover:bg-primary-hover text-primary-foreground gap-2"
                onClick={handleSend}
                disabled={sending}>
                <Send className="h-4 w-4" />
                {sending ? 'Sending…' : 'Send'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Notification?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently delete this notification.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border" disabled={deleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90 text-white">
              {deleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
