'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNotificationFilters } from '@/hooks/admin/useNotificationFilters';
import { useAdminNotificationsQuery } from '@/hooks/admin/useAdminNotificationsQuery';
import { NotificationsTable } from '@/components/admin/notifications/NotificationsTable';
import { SendNotificationDialog } from '@/components/admin/notifications/SendNotificationDialog';
import { NotificationDetailModal } from '@/components/admin/notifications/NotificationDetailModal';
import { DeleteNotificationDialog } from '@/components/admin/notifications/DeleteNotificationDialog';
import { NotificationsFilters } from '@/components/admin/notifications/NotificationsFilters';
import { Card, CardContent, CardHeader } from '@/components/ui';

export default function NotificationsPage() {
  const {
    search,
    debouncedSearch,
    isRead,
    isEmailed,
    page,
    setPage,
    resetPage,
    setSearch,
    setIsRead,
    setIsEmailed,
  } = useNotificationFilters();

  const { data, isLoading } = useAdminNotificationsQuery({
    search: debouncedSearch,
    page,
    is_read: isRead,
    is_emailed: isEmailed,
    page_size: 10,
  });

  const [isSendDialogOpen, setIsSendDialogOpen] = useState<boolean>(false);
  const [selectedNotificationId, setSelectedNotificationId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading && data && data.results.length === 0 && page > 1) {
      setPage(page - 1);
    }
  }, [data, isLoading, page, setPage]);

  const pagination = {
    count: data?.count ?? 0,
    total_pages: data?.total_pages ?? 1,
    current_page: data?.current_page ?? 1,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Manage and send user notifications.</p>
        </div>
        <Button onClick={() => setIsSendDialogOpen(true)}>Send Notification</Button>
      </div>
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-4">
          <NotificationsFilters
            search={search}
            onSearchChange={(v) => {
              setSearch(v);
              resetPage();
            }}
            isRead={isRead}
            onIsReadChange={(v) => {
              setIsRead(v);
              resetPage();
            }}
            isEmailed={isEmailed}
            onIsEmailedChange={(v) => {
              setIsEmailed(v);
              resetPage();
            }}
          />
        </CardHeader>
        <CardContent>
          <NotificationsTable
            notifications={data?.results ?? []}
            isLoading={isLoading}
            pagination={pagination}
            page={page}
            onPageChange={setPage}
            onView={(id) => setSelectedNotificationId(id)}
            onDelete={(id) => setDeleteId(id)}
          />
        </CardContent>
      </Card>
      <NotificationDetailModal
        id={selectedNotificationId}
        open={selectedNotificationId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedNotificationId(null);
        }}
      />
      <SendNotificationDialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen} />
      <DeleteNotificationDialog
        id={deleteId !== null ? String(deleteId) : null}
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      />
    </div>
  );
}
