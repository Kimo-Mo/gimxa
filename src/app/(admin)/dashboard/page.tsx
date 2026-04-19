'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard, Users, ArrowRight, Package, Home } from 'lucide-react';
import { orderService } from '@/services/order.service';
import { userService } from '@/services/user.service';
import { catalogService } from '@/services/catalog.service';
import type { AdminOrder } from '@/types/admin/orders';
import type { PaginatedResponse } from '@/types/common';

import { OrderStatusBadge } from '@/components/admin/orders/OrderStatusBadge';

// ─── Stat card skeleton ──────────────────────────────────────────────────
function StatCardSkeleton() {
  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-7 w-24 mb-1" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [totalOrders, setTotalOrders] = useState<number | null>(null);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [totalProducts, setTotalProducts] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      setError(null);
      try {
        const [ordersRes, usersRes, productsRes] = await Promise.allSettled([
          orderService.adminOrdersList({ page_size: 5, page: 1 }) as Promise<
            PaginatedResponse<AdminOrder>
          >,
          userService.adminUsersList({ page_size: 1, page: 1 }),
          catalogService.adminProductsList({ page_size: 1, page: 1 }),
        ]);

        if (ordersRes.status === 'fulfilled') {
          const data = ordersRes.value as PaginatedResponse<AdminOrder>;
          setRecentOrders(data?.results ?? []);
          setTotalOrders(data?.count ?? null);
        }
        if (usersRes.status === 'fulfilled') {
          setTotalUsers(usersRes.value?.count ?? null);
        }
        if (productsRes.status === 'fulfilled') {
          setTotalProducts(productsRes.value?.count ?? null);
        }
      } catch {
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const stats = [
    {
      title: 'Total Orders',
      value: totalOrders,
      icon: CreditCard,
      sub: 'All time orders',
      href: '/dashboard/orders',
    },
    {
      title: 'Total Users',
      value: totalUsers,
      icon: Users,
      sub: 'Registered accounts',
      href: '/dashboard/users',
    },
    {
      title: 'Total Products',
      value: totalProducts,
      icon: Package,
      sub: 'In catalog',
      href: '/dashboard/products',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap space-y-2">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back. Here is what&apos;s happening today.
        </p>
      </div>
        <Link href={'/'} >
          <Button className="bg-primary hover:bg-primary-hover text-primary-foreground">
            <Home className="mr-2 h-4 w-4" /> Go to Store
          </Button>
        </Link>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)
          : stats.map((stat) => (
              <Card key={stat.title} className="bg-card border-border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {stat.value !== null ? stat.value.toLocaleString() : '—'}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground">{stat.sub}</p>
                    {stat.href && (
                      <Link href={stat.href}>
                        <ArrowRight className="h-5 w-5 text-primary cursor-pointer" />
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Recent Orders */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-foreground">Recent Orders</CardTitle>
          <Link href="/dashboard/orders">
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {error && <div className="text-center py-8 text-destructive text-sm">{error}</div>}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-4 w-16 ml-auto" />
                </div>
              ))}
            </div>
          ) : !error && recentOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No orders yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Order #</TableHead>
                  <TableHead className="text-muted-foreground">User</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Items</TableHead>
                  <TableHead className="text-right text-muted-foreground">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id} className="border-border hover:bg-muted/50">
                    <TableCell className="font-medium text-foreground tracking-tight text-sm">
                      #{order.order_number}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{order.user}</TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {order.items_count}
                    </TableCell>
                    <TableCell className="text-right font-medium text-foreground text-sm">
                      ${parseFloat(order.total_price).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
