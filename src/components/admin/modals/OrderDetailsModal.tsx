'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { orderService } from '@/services/order.service';
import type { AdminOrderDetail, OrderStatus } from '@/types/admin/orders';
import { toast } from 'sonner';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
}

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
];

function StatusBadge({ status }: { status: OrderStatus }) {
  const config: Record<string, string> = {
    completed: 'bg-success/20 text-success border-none',
    pending: 'bg-warning/20 text-warning border-none',
    processing: 'bg-blue-500/20 text-blue-400 border-none',
    failed: 'bg-destructive/20 text-destructive border-none',
    cancelled: 'bg-muted/60 text-muted-foreground border-none',
  };
  return (
    <Badge
      className={`${config[status] ?? 'bg-muted/60 text-muted-foreground border-none'} font-medium capitalize`}>
      {status}
    </Badge>
  );
}

export function OrderDetailsModal({ isOpen, onClose, orderId }: OrderDetailsModalProps) {
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!isOpen || !orderId) return;
    setLoading(true);
    setError(null);
    setOrder(null);
    orderService
      .adminOrderDetails(orderId)
      .then((data: AdminOrderDetail) => {
        setOrder(data);
        setNewStatus(data.status);
      })
      .catch(() => setError('Failed to load order details.'))
      .finally(() => setLoading(false));
  }, [isOpen, orderId]);

  const handleStatusUpdate = async () => {
    if (!newStatus || !orderId) return;
    setUpdating(true);
    try {
      await orderService.adminUpdateOrder(orderId, { status: newStatus });
      toast.success(`Order status updated to "${newStatus}".`);
      // Update local state
      setOrder((prev) => (prev ? { ...prev, status: newStatus as OrderStatus } : prev));
    } catch {
      toast.error('Failed to update order status.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-3">
            Order Details
            {order && <StatusBadge status={order.status} />}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {order ? `#${order.order_number}` : `Loading order ${orderId}…`}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive text-sm">{error}</div>
        ) : order ? (
          <div className="space-y-6 py-2">
            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground text-xs mb-0.5">Order Number</div>
                <div className="font-mono font-semibold text-foreground">#{order.order_number}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs mb-0.5">Date</div>
                <div className="text-foreground">{new Date(order.created_at).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs mb-0.5">Status</div>
                <StatusBadge status={order.status} />
              </div>
              <div>
                <div className="text-muted-foreground text-xs mb-0.5">Subtotal</div>
                <div className="text-foreground">${parseFloat(order.subtotal).toFixed(2)}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs mb-0.5">Tax</div>
                <div className="text-foreground">${parseFloat(order.tax).toFixed(2)}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs mb-0.5">Discount</div>
                <div className="text-foreground">
                  ${parseFloat(order.discount_total).toFixed(2)}
                </div>
              </div>
              {order.coupon_code && (
                <div>
                  <div className="text-muted-foreground text-xs mb-0.5">Coupon</div>
                  <div className="font-mono text-primary text-sm">{order.coupon_code}</div>
                </div>
              )}
              <div className="col-span-2 sm:col-span-1">
                <div className="text-muted-foreground text-xs mb-0.5">Total</div>
                <div className="text-foreground font-bold text-lg">
                  ${parseFloat(order.total_price).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Payment Details */}
            {order.payment_details && (
              <>
                <Separator className="bg-border" />
                <div>
                  <div className="text-sm font-medium text-foreground mb-3">Payment</div>
                  <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 rounded-lg p-4 border border-border">
                    <div>
                      <div className="text-muted-foreground text-xs mb-0.5">Gateway</div>
                      <div className="text-foreground">{order.payment_details.gateway_name}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs mb-0.5">Status</div>
                      <Badge variant="outline" className="border-border text-xs capitalize">
                        {order.payment_details.status}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs mb-0.5">Amount Paid</div>
                      <div className="text-foreground">
                        ${parseFloat(order.payment_details.amount).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Order Items */}
            <Separator className="bg-border" />
            <div>
              <div className="text-sm font-medium text-foreground mb-3">
                Order Items ({order.items.length})
              </div>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border text-sm">
                    <div>
                      <div className="font-medium text-foreground">{item.product_name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Qty: {item.quantity} · {item.is_topup ? 'Top-Up' : 'Digital Code'}
                      </div>
                      {item.topup_data && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {Object.entries(item.topup_data).map(([k, v]) => (
                            <span key={k} className="mr-3">
                              {k}: <span className="text-foreground">{v}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="font-semibold text-foreground ml-4 shrink-0">
                      ${parseFloat(item.price).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Update */}
            <Separator className="bg-border" />
            <div>
              <div className="text-sm font-medium text-foreground mb-3">Update Status</div>
              <div className="flex gap-3 items-center">
                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as OrderStatus)}>
                  <SelectTrigger
                    id="order-status-select"
                    className="w-48 bg-background border-border">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleStatusUpdate}
                  disabled={updating || newStatus === order.status}
                  className="bg-primary hover:bg-primary-hover text-primary-foreground">
                  {updating ? 'Updating…' : 'Update'}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex justify-end pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-border text-foreground hover:bg-muted">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
