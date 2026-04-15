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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Plus, Tag, Pencil, Trash2 } from 'lucide-react';
import { couponService } from '@/services/coupon.service';
import type { AdminCoupon, AdminCouponPayload, DiscountType } from '@/types/admin/coupons';
import { toast } from 'sonner';

function TableRowSkeleton() {
  return (
    <TableRow className="border-border">
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-16" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-12" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-16 rounded-full" />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex gap-2 justify-end">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </TableCell>
    </TableRow>
  );
}

const emptyForm: AdminCouponPayload = {
  code: '',
  discount_type: 'percent',
  discount_value: 0,
  active: true,
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<AdminCouponPayload>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await couponService.adminCouponsList();
      setCoupons(Array.isArray(data) ? data : (data?.results ?? []));
    } catch {
      setError('Failed to load coupons. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (coupon: AdminCoupon) => {
    setEditId(coupon.id);
    setForm({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      active: coupon.active,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.code.trim() || form.discount_value <= 0) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setSaving(true);
    try {
      if (editId !== null) {
        await couponService.adminUpdateCoupon(editId, form);
        toast.success('Coupon updated successfully.');
      } else {
        await couponService.adminAddCoupon(form);
        toast.success('Coupon created successfully.');
      }
      setFormOpen(false);
      fetchCoupons();
    } catch {
      toast.error(editId !== null ? 'Failed to update coupon.' : 'Failed to create coupon.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    setDeleting(true);
    try {
      // Note: no adminDeleteCoupon in current service — show a message
      toast.info('Delete not yet available via API.');
    } catch {
      toast.error('Failed to delete coupon.');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Coupon Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage discount coupons.</p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-primary hover:bg-primary-hover text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" /> Create Coupon
        </Button>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-foreground">
            All Coupons{' '}
            {coupons.length > 0 && (
              <span className="text-muted-foreground font-normal text-sm ml-1">
                ({coupons.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-12 text-destructive text-sm">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-medium">Code</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Discount</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Type</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                    <TableHead className="text-right text-muted-foreground font-medium">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} />)
                  ) : coupons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Tag className="h-10 w-10 opacity-30" />
                          <span className="text-sm">No coupons found.</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    coupons.map((coupon) => (
                      <TableRow key={coupon.id} className="border-border hover:bg-muted/50">
                        <TableCell className="font-mono font-medium text-foreground text-sm tracking-wider">
                          {coupon.code}
                        </TableCell>
                        <TableCell className="font-medium text-foreground text-sm">
                          {coupon.discount_type === 'percent'
                            ? `${coupon.discount_value}%`
                            : `$${coupon.discount_value}`}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="border-border text-muted-foreground text-xs capitalize">
                            {coupon.discount_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {coupon.active ? (
                            <Badge className="bg-success/20 text-success hover:bg-success/30 border-none font-medium">
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-muted/60 text-muted-foreground hover:bg-muted border-none font-medium">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
                              onClick={() => openEdit(coupon)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteId(coupon.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editId !== null ? 'Edit Coupon' : 'Create Coupon'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editId !== null
                ? 'Update the coupon details.'
                : 'Fill in the details to create a new discount coupon.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="coupon-code" className="text-foreground text-sm">
                Code *
              </Label>
              <Input
                id="coupon-code"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. SUMMER25"
                className="bg-background border-border font-mono"
                disabled={editId !== null}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="discount-type" className="text-foreground text-sm">
                Discount Type *
              </Label>
              <Select
                value={form.discount_type}
                onValueChange={(v) => setForm((f) => ({ ...f, discount_type: v as DiscountType }))}>
                <SelectTrigger id="discount-type" className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="percent">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="discount-value" className="text-foreground text-sm">
                Discount Value * {form.discount_type === 'percent' ? '(%)' : '($)'}
              </Label>
              <Input
                id="discount-value"
                type="number"
                min={0}
                max={form.discount_type === 'percent' ? 100 : undefined}
                value={form.discount_value}
                onChange={(e) =>
                  setForm((f) => ({ ...f, discount_value: parseFloat(e.target.value) || 0 }))
                }
                className="bg-background border-border"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="coupon-active"
                checked={!!form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                className="h-4 w-4 accent-primary"
              />
              <Label htmlFor="coupon-active" className="text-sm text-foreground cursor-pointer">
                Active (coupon can be used immediately)
              </Label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                className="border-border"
                onClick={() => setFormOpen(false)}
                disabled={saving}>
                Cancel
              </Button>
              <Button
                className="bg-primary hover:bg-primary-hover text-primary-foreground"
                onClick={handleSave}
                disabled={saving}>
                {saving ? 'Saving…' : editId !== null ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Coupon?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently delete this coupon code.
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
