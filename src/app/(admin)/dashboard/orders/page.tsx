'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { orderService } from '@/services/order.service';
import { OrderDetailsModal } from '@/components/admin/modals/OrderDetailsModal';
import type { AdminOrder, OrderStatus } from '@/types/admin/orders';
import type { PaginatedResponse } from '@/types/common';

const PAGE_SIZE = 10;

type TabStatus = 'all' | 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config: Record<string, { label: string; className: string }> = {
    completed: {
      label: 'Completed',
      className: 'bg-success/20 text-success hover:bg-success/30 border-none font-medium',
    },
    pending: {
      label: 'Pending',
      className: 'bg-warning/20 text-warning hover:bg-warning/30 border-none font-medium',
    },
    processing: {
      label: 'Processing',
      className: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-none font-medium',
    },
    failed: {
      label: 'Failed',
      className:
        'bg-destructive/20 text-destructive hover:bg-destructive/30 border-none font-medium',
    },
    cancelled: {
      label: 'Cancelled',
      className: 'bg-muted/60 text-muted-foreground hover:bg-muted border-none font-medium',
    },
  };
  const cfg = config[status] ?? {
    label: status,
    className: 'bg-muted/60 text-muted-foreground border-none font-medium',
  };
  return <Badge className={cfg.className}>{cfg.label}</Badge>;
}

function TableRowSkeleton() {
  return (
    <TableRow className="border-border">
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-20 rounded-full" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-4" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-4 w-16 ml-auto" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-8 w-16 ml-auto rounded" />
      </TableCell>
    </TableRow>
  );
}

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState<TabStatus>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [pagination, setPagination] = useState({ count: 0, total_pages: 1, current_page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(id);
  }, [search]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = {
        page,
        page_size: PAGE_SIZE,
      };
      if (activeTab !== 'all') params.status = activeTab;
      if (debouncedSearch) params.search = debouncedSearch;

      const data = (await orderService.adminOrdersList(
        params as Parameters<typeof orderService.adminOrdersList>[0]
      )) as PaginatedResponse<AdminOrder>;
      setOrders(data?.results ?? []);
      setPagination({
        count: data?.count ?? 0,
        total_pages: data?.total_pages ?? 1,
        current_page: data?.current_page ?? 1,
      });
    } catch {
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, debouncedSearch, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Reset page on filter/search change
  useEffect(() => {
    setPage(1);
  }, [activeTab, debouncedSearch]);

  const tabs: { value: TabStatus; label: string }[] = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const triggerCls =
    'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm px-4';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Order Management</h1>
        <p className="text-muted-foreground mt-1">Review and manage customer orders.</p>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle className="text-foreground">Orders</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="orders-search"
                placeholder="Search by order # or user…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background border-border h-9 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TabStatus)}
            className="w-full">
            <TabsList className="bg-muted p-1 mb-6 inline-flex w-auto border border-border flex-wrap h-auto gap-1">
              {tabs.map((t) => (
                <TabsTrigger key={t.value} value={t.value} className={triggerCls}>
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {tabs.map((t) => (
              <TabsContent
                key={t.value}
                value={t.value}
                className="m-0 focus-visible:outline-none focus-visible:ring-0">
                {error ? (
                  <div className="text-center py-12 text-destructive text-sm">{error}</div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="text-muted-foreground font-medium">
                              Order #
                            </TableHead>
                            <TableHead className="text-muted-foreground font-medium">
                              User
                            </TableHead>
                            <TableHead className="text-muted-foreground font-medium">
                              Date
                            </TableHead>
                            <TableHead className="text-muted-foreground font-medium">
                              Status
                            </TableHead>
                            <TableHead className="text-muted-foreground font-medium">
                              Items
                            </TableHead>
                            <TableHead className="text-right text-muted-foreground font-medium">
                              Amount
                            </TableHead>
                            <TableHead className="text-right text-muted-foreground font-medium">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loading ? (
                            Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} />)
                          ) : orders.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={7}
                                className="text-center py-12 text-muted-foreground text-sm">
                                No orders found.
                              </TableCell>
                            </TableRow>
                          ) : (
                            orders.map((order) => (
                              <TableRow key={order.id} className="border-border hover:bg-muted/50">
                                <TableCell className="font-medium text-foreground tracking-tight text-sm">
                                  #{order.order_number}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                  {order.user}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                  {new Date(order.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <OrderStatusBadge status={order.status} />
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm text-center">
                                  {order.items_count}
                                </TableCell>
                                <TableCell className="text-right font-medium text-foreground text-sm">
                                  ${parseFloat(order.total_price).toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-primary hover:text-primary-hover hover:bg-primary/10 gap-2 h-8"
                                    onClick={() => setSelectedOrderId(order.order_number)}>
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only sm:not-sr-only">View</span>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {pagination.total_pages > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                        <p className="text-sm text-muted-foreground">
                          Page {pagination.current_page} of {pagination.total_pages} (
                          {pagination.count} total)
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
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <OrderDetailsModal
        isOpen={!!selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        orderId={selectedOrderId || ''}
      />
    </div>
  );
}
