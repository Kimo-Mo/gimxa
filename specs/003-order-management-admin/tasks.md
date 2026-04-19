# Tasks: Admin Order Management

**Input**: Design documents from `specs/003-order-management-admin/`  
**Branch**: `003-order-management-admin`  
**Spec**: `specs/003-order-management-admin/spec.md`  
**Plan**: `specs/003-order-management-admin/plan.md`  
**Data Model**: `specs/003-order-management-admin/data-model.md`  
**Research**: `specs/003-order-management-admin/research.md`  
**Quickstart**: `specs/003-order-management-admin/quickstart.md`

---

## ⚠️ Pre-Implementation: Read These First

Before touching any file, read:
1. `specs/003-order-management-admin/quickstart.md` — exact patterns per file
2. `specs/003-order-management-admin/data-model.md` — all shapes, Zod schemas, badge colors
3. `src/hooks/admin/useTopupMutations.ts` — canonical `useMutation` + `useCacheClear` pattern in this project

**Architecture rules (non-negotiable)**:
- ALL data fetching → `useQuery` only. No `useEffect` + `useState` for server data.
- ALL writes → `useMutation` only.
- Every `onSuccess` → `await cacheClear()` THEN `queryClient.invalidateQueries(...)`.
- No `any` types. No inline `style` props. Tailwind CSS 4 only.
- All forms use React Hook Form + Zod. No uncontrolled inputs without validation.
- Use `useCacheClear` from `src/hooks/admin/useCacheClear.ts` — already exists project-wide.
- The existing `orderService` at `src/services/order.service.ts` has all required endpoints — do not modify it.
- The API response for orders list wraps paginated data inside `response.status` (not top-level). See D-10 in research.md.

---

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to

---

## Phase 1: Setup — Type & Query Key Patches

**Purpose**: Fix the two type gaps and extend query keys. These MUST be done first — every subsequent task depends on them.

---

- [X] T001 Extend `AdminOrderUpdatePayload` in `src/types/admin/orders.ts` — add optional notification fields.

  Find the current interface (around line 60):
  ```ts
  export interface AdminOrderUpdatePayload {
    status: OrderStatus;
  }
  ```
  Replace it with:
  ```ts
  export interface AdminOrderUpdatePayload {
    status: OrderStatus;
    send_notification?: boolean;
    notification_data?: {
      subject: string;
      message: string;
      email_type: string; // default: 'default'
    };
  }
  ```

  > **Why**: The existing type is missing the notification payload fields defined in PLAN.md. All mutation hooks depend on this shape (Constitution §II: all payloads strictly typed).

- [X] T002 Extend `adminQueryKeys` in `src/hooks/admin/queryKeys.ts` — add `orders` and `order` key factories.

  The current file ends at:
  ```ts
  tags: () => ['admin', 'tags'] as const,
  ```
  Add two new entries before the closing `} as const;`:
  ```ts
  orders: (params: AdminOrderListParams) => ['admin', 'orders', params] as const,
  order:  (id: string)                  => ['admin', 'order',  id]     as const,
  ```
  Also add the import at the top of the file:
  ```ts
  import type { AdminOrderListParams } from '@/types/admin/orders';
  ```

  The final file should export keys for: `products`, `product`, `topups`, `topup`, `packages`, `categories`, `tags`, `orders`, `order`.

**Checkpoint**: Run `npx tsc --noEmit` from `c:\iProjects\gimxa`. Zero errors before continuing.

---

## Phase 2: Foundational — React Query Hooks

**Purpose**: All query/mutation hooks for the orders module. Must be complete before any UI component can be written.  
**Pattern**: Study `src/hooks/admin/useTopupMutations.ts` — every mutation here follows the same structure.

---

- [X] T003 [P] Create `src/hooks/admin/useAdminOrdersQuery.ts` — `useQuery` hook for the paginated admin orders list.

  Full file content:
  ```ts
  import { useQuery, keepPreviousData } from '@tanstack/react-query';
  import { orderService } from '@/services/order.service';
  import { adminQueryKeys } from './queryKeys';
  import type { AdminOrderListParams, AdminOrder } from '@/types/admin/orders';

  interface PaginatedOrdersResult {
    results: AdminOrder[];
    count: number;
    total_pages: number;
    current_page: number;
    page_size: number;
    next: string | null;
    previous: string | null;
  }

  export function useAdminOrdersQuery(params: AdminOrderListParams) {
    return useQuery<PaginatedOrdersResult>({
      queryKey: adminQueryKeys.orders(params),
      queryFn: async () => {
        const data = await orderService.adminOrdersList(params);
        // The API wraps the paginated payload inside data.status (not top-level)
        return data.status as PaginatedOrdersResult;
      },
      placeholderData: keepPreviousData,
    });
  }
  ```

  > **Key detail**: `data.status` — not `data.results` — is where the paginated payload lives. See PLAN.md response shape.

- [X] T004 [P] Create `src/hooks/admin/useAdminOrderDetailQuery.ts` — `useQuery` hook for a single order detail, loaded on demand when the modal is open.

  Full file content:
  ```ts
  import { useQuery } from '@tanstack/react-query';
  import { orderService } from '@/services/order.service';
  import { adminQueryKeys } from './queryKeys';
  import type { AdminOrderDetail } from '@/types/admin/orders';

  export function useAdminOrderDetailQuery(orderId: string) {
    return useQuery<AdminOrderDetail>({
      queryKey: adminQueryKeys.order(orderId),
      queryFn: () => orderService.adminOrderDetails(orderId) as Promise<AdminOrderDetail>,
      enabled: !!orderId, // Only fetches when modal is open with a valid ID
    });
  }
  ```

- [X] T005 Create `src/hooks/admin/useAdminOrderMutations.ts` — two mutations: update order status (with optional notification) and delete order.

  Full file content:
  ```ts
  import { useMutation, useQueryClient } from '@tanstack/react-query';
  import { orderService } from '@/services/order.service';
  import { adminQueryKeys } from './queryKeys';
  import { useCacheClear } from './useCacheClear';
  import { toast } from 'sonner';
  import type { AdminOrderUpdatePayload } from '@/types/admin/orders';

  // --- Update Order Status (+ optional notification) ---
  export function useAdminUpdateOrderMutation() {
    const queryClient = useQueryClient();
    const cacheClear = useCacheClear();

    return useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: AdminOrderUpdatePayload;
      }) => orderService.adminUpdateOrder(id, payload),

      onSuccess: async (_, { id }) => {
        await cacheClear();
        await queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
        await queryClient.invalidateQueries({ queryKey: adminQueryKeys.order(id) });
        toast.success('Order status updated successfully.');
      },

      onError: () => {
        toast.error('Failed to update order status. Please try again.');
      },
    });
  }

  // --- Delete Order ---
  export function useAdminDeleteOrderMutation() {
    const queryClient = useQueryClient();
    const cacheClear = useCacheClear();

    return useMutation({
      mutationFn: (id: string) => orderService.adminDeleteOrder(id),

      onSuccess: async () => {
        await cacheClear();
        await queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
        toast.success('Order deleted successfully.');
      },

      onError: () => {
        toast.error('Failed to delete order. Please try again.');
      },
    });
  }
  ```

**Checkpoint**: Run `npx tsc --noEmit`. All three hook files must compile with zero errors.

---

## Phase 3: User Story 1 — Browse & Filter Orders (Priority: P1) 🎯 MVP

**Goal**: Replace the existing `useEffect`/`useState` data-fetching in `page.tsx` with `useAdminOrdersQuery`. Add the `paid` tab to the status filter strip. Encode filter/search/page in URL search params so state survives navigation. Extract `OrderStatusBadge` as a standalone shared component.

**Independent Test**: Navigate to `/dashboard/orders`. The table loads with a skeleton during fetch, then shows orders. Click the "Paid" tab — only `paid` orders appear. Type a username in the search box — results filter after ~400ms. Navigate to page 2 — URL changes to `?page=2`. Press browser Back — `?page=2` is restored and data re-fetches correctly. Run `npx tsc --noEmit` — zero errors.

---

### Implementation for User Story 1

- [X] T006 [P] [US1] Create `src/components/admin/orders/OrderStatusBadge.tsx` — shared status badge for all 6 statuses (extracted from existing page.tsx so both the page and modal can import it).

  Full file content:
  ```tsx
  import { Badge } from '@/components/ui/badge';
  import type { OrderStatus } from '@/types/admin/orders';

  const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
    completed: {
      label: 'Completed',
      className: 'bg-success/20 text-success hover:bg-success/30 border-none font-medium',
    },
    pending: {
      label: 'Pending',
      className: 'bg-warning/20 text-warning hover:bg-warning/30 border-none font-medium',
    },
    paid: {
      label: 'Paid',
      className: 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-none font-medium',
    },
    processing: {
      label: 'Processing',
      className: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-none font-medium',
    },
    failed: {
      label: 'Failed',
      className: 'bg-destructive/20 text-destructive hover:bg-destructive/30 border-none font-medium',
    },
    cancelled: {
      label: 'Cancelled',
      className: 'bg-muted/60 text-muted-foreground hover:bg-muted border-none font-medium',
    },
  };

  export function OrderStatusBadge({ status }: { status: OrderStatus }) {
    const cfg = STATUS_CONFIG[status] ?? {
      label: status,
      className: 'bg-muted/60 text-muted-foreground border-none font-medium',
    };
    return <Badge className={cfg.className}>{cfg.label}</Badge>;
  }
  ```

- [X] T007 [US1] Refactor `src/app/(admin)/dashboard/orders/page.tsx` — replace the entire data-fetching layer with `useAdminOrdersQuery` and URL search params.

  This is a full file refactor. The new file must:

  **1. Remove all illegal patterns** — delete these from the file entirely:
  - `useState<AdminOrder[]>` for orders
  - `useState` for pagination, loading, error
  - The `fetchOrders` `useCallback`
  - Both `useEffect` blocks that call `fetchOrders` and reset page
  - The debounce `useEffect` for search

  **2. Add URL param imports** at the top:
  ```ts
  import { useSearchParams, useRouter, usePathname } from 'next/navigation';
  ```

  **3. Add React Query import** at the top:
  ```ts
  import { useAdminOrdersQuery } from '@/hooks/admin/useAdminOrdersQuery';
  ```

  **4. Replace the `OrderStatusBadge` function** defined inline in the file with an import:
  ```ts
  import { OrderStatusBadge } from '@/components/admin/orders/OrderStatusBadge';
  ```
  Delete the old inline `OrderStatusBadge` and `config` constant.

  **5. Add `paid` to the tab strip** — update the `TabStatus` type and `tabs` array:
  ```ts
  type TabStatus = 'all' | 'pending' | 'paid' | 'processing' | 'completed' | 'failed' | 'cancelled';

  const tabs: { value: TabStatus; label: string }[] = [
    { value: 'all',        label: 'All Orders'  },
    { value: 'pending',    label: 'Pending'     },
    { value: 'paid',       label: 'Paid'        },
    { value: 'processing', label: 'Processing'  },
    { value: 'completed',  label: 'Completed'   },
    { value: 'failed',     label: 'Failed'      },
    { value: 'cancelled',  label: 'Cancelled'   },
  ];
  ```

  **6. Derive state from URL params** inside `AdminOrdersPage`:
  ```ts
  const searchParams = useSearchParams();
  const router       = useRouter();
  const pathname     = usePathname();

  const activeTab = (searchParams.get('status') ?? 'all') as TabStatus;
  const search    = searchParams.get('search') ?? '';
  const page      = Number(searchParams.get('page') ?? '1');
  ```

  **7. Add a URL updater helper** inside the component:
  ```ts
  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === '') params.delete(k);
      else params.set(k, v);
    });
    router.push(`${pathname}?${params.toString()}`);
  };
  ```

  **8. Add the React Query call** (replaces all the old state):
  ```ts
  const { data, isPending, isError } = useAdminOrdersQuery({
    status:    activeTab === 'all' ? undefined : activeTab,
    search:    search || undefined,
    page,
    page_size: PAGE_SIZE,
  });

  const orders     = data?.results ?? [];
  const pagination = {
    count:        data?.count        ?? 0,
    total_pages:  data?.total_pages  ?? 1,
    current_page: data?.current_page ?? 1,
  };
  ```

  **9. Update tab onChange** to write to URL (replaces `setActiveTab`):
  ```ts
  onValueChange={(v) => updateParams({ status: v === 'all' ? null : v, page: null })}
  ```

  **10. Update search input onChange** — add a debounce via `useState` + `useEffect` for the raw input only (NOT for data fetching):
  ```ts
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    const id = setTimeout(() => {
      updateParams({ search: searchInput || null, page: null });
    }, 400);
    return () => clearTimeout(id);
  }, [searchInput]);
  ```
  Change the Input's `value` to `searchInput` and `onChange` to `(e) => setSearchInput(e.target.value)`.

  **11. Update the table body** to use `isPending` and `isError` instead of old `loading`/`error` state:
  - Replace `{loading ? (` with `{isPending ? (`
  - Replace `{error ? (` with `{isError ? (`
  - The error message div can stay the same text

  **12. Update pagination buttons** to use URL params:
  ```ts
  // Prev button:
  onClick={() => updateParams({ page: String(Math.max(1, page - 1)) })}
  disabled={page <= 1 || isPending}

  // Next button:
  onClick={() => updateParams({ page: String(Math.min(pagination.total_pages, page + 1)) })}
  disabled={page >= pagination.total_pages || isPending}
  ```

  **13. Keep `selectedOrderId` state as-is** — this is client UI state (modal open/close), which is the one valid use of `useState` here.

  **14. Keep `setActiveTab` usage in `onValueChange`** removed — replaced by URL param update in step 9.

  > **Note**: The `TableRowSkeleton` component inside the file can stay as a local function — no need to extract it.

**Checkpoint (US1)**: Navigate to `/dashboard/orders`. Verify:
- Table renders with skeleton loading, then shows data
- All 7 tabs render (All / Pending / Paid / Processing / Completed / Failed / Cancelled)
- Clicking Paid tab changes URL to `?status=paid` and table shows only paid orders
- Typing in search updates URL after ~400ms
- Page 2 navigation changes URL to `?page=2`
- Browser Back restores previous filter/page
- Run `npx tsc --noEmit` — zero errors

---

## Phase 4: User Story 2 — View Order Detail (Priority: P2)

**Goal**: Break the monolithic `OrderDetailsModal.tsx` (263 lines, uses `useEffect`/`useState`) into typed sub-components backed by `useAdminOrderDetailQuery`. The modal shell becomes a thin wrapper that assembles the sub-components.

**Independent Test**: Click any row's View button. The modal opens. A skeleton shows while loading. The modal displays order number, date, status badge, subtotal, tax, discount, total, coupon (if any), payment details (if any), all order items with product name + quantity + price + top-up fields. Closing the modal via the Close button or clicking outside dismisses it cleanly. Run `npx tsc --noEmit` — zero errors.

---

### Implementation for User Story 2

- [X] T008 [P] [US2] Create `src/components/admin/orders/OrderDetailSummary.tsx` — financial summary grid section displayed at the top of the modal.

  Full file content:
  ```tsx
  import { Separator } from '@/components/ui/separator';
  import { OrderStatusBadge } from './OrderStatusBadge';
  import type { AdminOrderDetail } from '@/types/admin/orders';

  interface OrderDetailSummaryProps {
    order: AdminOrderDetail;
  }

  export function OrderDetailSummary({ order }: OrderDetailSummaryProps) {
    const fmt = (val: string) => `$${parseFloat(val).toFixed(2)}`;

    return (
      <div className="space-y-4">
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
            <OrderStatusBadge status={order.status} />
          </div>
          <div>
            <div className="text-muted-foreground text-xs mb-0.5">Subtotal</div>
            <div className="text-foreground">{fmt(order.subtotal)}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs mb-0.5">Tax</div>
            <div className="text-foreground">{fmt(order.tax)}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs mb-0.5">Discount</div>
            <div className="text-foreground">{fmt(order.discount_total)}</div>
          </div>
          {order.coupon_code && (
            <div>
              <div className="text-muted-foreground text-xs mb-0.5">Coupon</div>
              <div className="font-mono text-primary text-sm">{order.coupon_code}</div>
            </div>
          )}
          <div className="col-span-2 sm:col-span-1">
            <div className="text-muted-foreground text-xs mb-0.5">Total</div>
            <div className="text-foreground font-bold text-lg">{fmt(order.total_price)}</div>
          </div>
        </div>
        <Separator className="bg-border" />
      </div>
    );
  }
  ```

- [X] T009 [P] [US2] Create `src/components/admin/orders/OrderDetailItems.tsx` — order items list with top-up data display.

  Full file content:
  ```tsx
  import type { AdminOrderItem } from '@/types/admin/orders';

  interface OrderDetailItemsProps {
    items: AdminOrderItem[];
  }

  export function OrderDetailItems({ items }: OrderDetailItemsProps) {
    return (
      <div>
        <div className="text-sm font-medium text-foreground mb-3">
          Order Items ({items.length})
        </div>
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border text-sm"
            >
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
    );
  }
  ```

- [ ] T010 [P] [US2] Create `src/components/admin/orders/OrderPaymentDetails.tsx` — payment gateway card, only rendered when `payment_details` is non-null.

  Full file content:
  ```tsx
  import { Badge } from '@/components/ui/badge';
  import { Separator } from '@/components/ui/separator';
  import type { OrderPaymentDetails as PaymentDetailsType } from '@/types/admin/orders';

  interface OrderPaymentDetailsProps {
    paymentDetails: PaymentDetailsType | null;
  }

  export function OrderPaymentDetails({ paymentDetails }: OrderPaymentDetailsProps) {
    if (!paymentDetails) return null;

    return (
      <>
        <Separator className="bg-border" />
        <div>
          <div className="text-sm font-medium text-foreground mb-3">Payment</div>
          <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 rounded-lg p-4 border border-border">
            <div>
              <div className="text-muted-foreground text-xs mb-0.5">Gateway</div>
              <div className="text-foreground">{paymentDetails.gateway_name}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs mb-0.5">Status</div>
              <Badge variant="outline" className="border-border text-xs capitalize">
                {paymentDetails.status}
              </Badge>
            </div>
            <div>
              <div className="text-muted-foreground text-xs mb-0.5">Amount Paid</div>
              <div className="text-foreground">
                ${parseFloat(paymentDetails.amount).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
  ```

- [ ] T011 [US2] Rebuild `src/components/admin/modals/OrderDetailsModal.tsx` — replace the monolithic implementation with a thin shell that uses `useAdminOrderDetailQuery` and assembles the sub-components.

  **Replace the entire file content** with:
  ```tsx
  'use client';

  import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
  } from '@/components/ui/dialog';
  import { Button } from '@/components/ui/button';
  import { Skeleton } from '@/components/ui/skeleton';
  import { Separator } from '@/components/ui/separator';
  import { useAdminOrderDetailQuery } from '@/hooks/admin/useAdminOrderDetailQuery';
  import { OrderDetailSummary } from '@/components/admin/orders/OrderDetailSummary';
  import { OrderDetailItems } from '@/components/admin/orders/OrderDetailItems';
  import { OrderPaymentDetails } from '@/components/admin/orders/OrderPaymentDetails';
  import { OrderStatusUpdate } from '@/components/admin/orders/OrderStatusUpdate';
  import { OrderDeleteAction } from '@/components/admin/orders/OrderDeleteAction';

  interface OrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
  }

  export function OrderDetailsModal({ isOpen, onClose, orderId }: OrderDetailsModalProps) {
    const { data: order, isPending, isError } = useAdminOrderDetailQuery(orderId);

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Order Details</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {order ? `#${order.order_number}` : isPending ? `Loading order ${orderId}…` : 'Order details'}
            </DialogDescription>
          </DialogHeader>

          {isPending ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : isError ? (
            <div className="text-center py-8 text-destructive text-sm">
              Failed to load order details. Please try again.
            </div>
          ) : order ? (
            <div className="space-y-6 py-2">
              <OrderDetailSummary order={order} />
              <OrderPaymentDetails paymentDetails={order.payment_details} />
              <Separator className="bg-border" />
              <OrderDetailItems items={order.items} />
              <Separator className="bg-border" />
              <OrderStatusUpdate order={order} onClose={onClose} />
              <Separator className="bg-border" />
              <OrderDeleteAction orderId={order.order_number} onSuccess={onClose} />
            </div>
          ) : null}

          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-border text-foreground hover:bg-muted"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  ```

  > **Note**: `OrderStatusUpdate` and `OrderDeleteAction` are created in Phases 5 and 6. If you are building in strict order, create stub components that return `null` temporarily so this file compiles — then replace them in T014 and T016.

**Checkpoint (US2)**: Click View on any order row. Verify: skeleton shows during load, then all sections render (summary grid, payment card if applicable, items list). Closing the modal works. Run `npx tsc --noEmit`.

---

## Phase 5: User Story 3 — Update Order Status (Priority: P3)

**Goal**: Implement the status update panel inside the order detail modal. The panel shows a dropdown with all 6 statuses, a "Send Notification" toggle that reveals subject + message fields when enabled, and an AlertDialog confirmation before committing. Uses `useAdminUpdateOrderMutation`.

**Independent Test**: Open any order's detail modal. In the "Update Status" section, select any different status from the dropdown. Click "Update Status" — an AlertDialog appears. Click "Confirm". Toast "Order status updated successfully." appears. The modal's status badge updates. The list table behind the modal refreshes. Toggle "Send Notification" on — subject and message fields appear and are required. Submitting without filling them shows validation errors. Run `npx tsc --noEmit`.

---

### Implementation for User Story 3

- [ ] T012 [P] [US3] Install `zod` and `react-hook-form` if not already present — check `package.json` first.

  Run: `npm list zod react-hook-form @hookform/resolvers`

  If any are missing, run: `npm install zod react-hook-form @hookform/resolvers`

  If all three are already listed in `package.json`, skip the install.

- [ ] T013 [US3] Create `src/components/admin/orders/OrderStatusUpdate.tsx` — status selector + optional notification toggle + AlertDialog confirmation, wired to `useAdminUpdateOrderMutation`.

  Full file content:
  ```tsx
  'use client';

  import { useState } from 'react';
  import { useForm } from 'react-hook-form';
  import { zodResolver } from '@hookform/resolvers/zod';
  import { z } from 'zod';
  import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from '@/components/ui/alert-dialog';
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
  import { Button } from '@/components/ui/button';
  import { Input } from '@/components/ui/input';
  import { Label } from '@/components/ui/label';
  import { Switch } from '@/components/ui/switch';
  import { Loader2 } from 'lucide-react';
  import { useAdminUpdateOrderMutation } from '@/hooks/admin/useAdminOrderMutations';
  import type { AdminOrderDetail, OrderStatus } from '@/types/admin/orders';

  const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
    { value: 'pending',    label: 'Pending'    },
    { value: 'paid',       label: 'Paid'       },
    { value: 'processing', label: 'Processing' },
    { value: 'completed',  label: 'Completed'  },
    { value: 'failed',     label: 'Failed'     },
    { value: 'cancelled',  label: 'Cancelled'  },
  ];

  const notifySchema = z.object({
    status: z.enum(['pending', 'paid', 'processing', 'completed', 'failed', 'cancelled']),
    send_notification: z.boolean().default(false),
    subject: z.string().optional(),
    message: z.string().optional(),
  }).superRefine((data, ctx) => {
    if (data.send_notification) {
      if (!data.subject?.trim()) {
        ctx.addIssue({ code: 'custom', path: ['subject'], message: 'Subject is required when sending notification' });
      }
      if (!data.message?.trim()) {
        ctx.addIssue({ code: 'custom', path: ['message'], message: 'Message is required when sending notification' });
      }
    }
  });

  type NotifyForm = z.infer<typeof notifySchema>;

  interface OrderStatusUpdateProps {
    order: AdminOrderDetail;
    onClose: () => void;
  }

  export function OrderStatusUpdate({ order, onClose }: OrderStatusUpdateProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const updateMutation = useAdminUpdateOrderMutation();

    const form = useForm<NotifyForm>({
      resolver: zodResolver(notifySchema),
      defaultValues: {
        status: order.status,
        send_notification: false,
        subject: '',
        message: '',
      },
    });

    const sendNotification = form.watch('send_notification');
    const selectedStatus   = form.watch('status');

    const handleConfirm = async () => {
      const isValid = await form.trigger();
      if (!isValid) {
        setDialogOpen(false);
        return;
      }
      const values = form.getValues();
      updateMutation.mutate(
        {
          id: order.order_number,
          payload: {
            status: values.status,
            ...(values.send_notification && {
              send_notification: true,
              notification_data: {
                subject:    values.subject ?? '',
                message:    values.message ?? '',
                email_type: 'default',
              },
            }),
          },
        },
        {
          onSuccess: () => {
            setDialogOpen(false);
            onClose();
          },
        }
      );
    };

    return (
      <div className="space-y-4">
        <div className="text-sm font-medium text-foreground">Update Status</div>

        {/* Status selector */}
        <div className="flex gap-3 items-center flex-wrap">
          <Select
            value={selectedStatus}
            onValueChange={(v) => form.setValue('status', v as OrderStatus)}
          >
            <SelectTrigger id="order-status-select" className="w-48 bg-background border-border">
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

          {/* AlertDialog wraps the trigger button */}
          <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button
                disabled={selectedStatus === order.status || updateMutation.isPending}
                className="bg-primary hover:bg-primary-hover text-primary-foreground"
                onClick={async (e) => {
                  e.preventDefault();
                  const isValid = await form.trigger();
                  if (isValid) setDialogOpen(true);
                }}
              >
                {updateMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating…</>
                ) : (
                  'Update Status'
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-foreground">Confirm Status Update</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  Change order #{order.order_number} status to{' '}
                  <span className="font-semibold text-foreground capitalize">{selectedStatus}</span>?
                  {sendNotification && ' A notification email will be sent to the customer.'}
                  {' '}This action cannot be undone without another manual update.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  className="border-border"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirm}
                  disabled={updateMutation.isPending}
                  className="bg-primary hover:bg-primary-hover text-primary-foreground"
                >
                  {updateMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating…</>
                  ) : (
                    'Confirm Update'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Send Notification toggle */}
        <div className="flex items-center gap-3">
          <Switch
            id="send-notification-toggle"
            checked={sendNotification}
            onCheckedChange={(v) => form.setValue('send_notification', v)}
          />
          <Label htmlFor="send-notification-toggle" className="text-sm text-foreground cursor-pointer">
            Send email notification to customer
          </Label>
        </div>

        {/* Notification fields — shown only when toggle is ON */}
        {sendNotification && (
          <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border">
            <div>
              <Label htmlFor="notification-subject" className="text-sm text-foreground mb-1.5 block">
                Subject <span className="text-destructive">*</span>
              </Label>
              <Input
                id="notification-subject"
                placeholder="e.g. Your order is processing"
                className="bg-background border-border"
                {...form.register('subject')}
              />
              {form.formState.errors.subject && (
                <p className="text-xs text-destructive mt-1">
                  {form.formState.errors.subject.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="notification-message" className="text-sm text-foreground mb-1.5 block">
                Message <span className="text-destructive">*</span>
              </Label>
              <Input
                id="notification-message"
                placeholder="e.g. Your order is now being processed…"
                className="bg-background border-border"
                {...form.register('message')}
              />
              {form.formState.errors.message && (
                <p className="text-xs text-destructive mt-1">
                  {form.formState.errors.message.message}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
  ```

**Checkpoint (US3)**: Open a modal. Change status from the dropdown. Click "Update Status". Confirm in the AlertDialog. Verify toast and list refresh. Toggle notification on — verify fields appear and are validated. Dismissing the AlertDialog makes no change. Run `npx tsc --noEmit`.

---

## Phase 6: User Story 4 — Delete Order (Priority: P4)

**Goal**: Add the "Delete Order" button inside the detail modal with an AlertDialog confirmation. Uses `useAdminDeleteOrderMutation`. On success, the modal closes and the list refreshes.

**Independent Test**: Open any order's detail modal. Scroll to the "Delete Order" section. Click "Delete Order" — an AlertDialog appears warning the action is permanent. Click "Confirm Delete". Toast "Order deleted successfully." The modal closes. The order row is gone from the list. Run `npx tsc --noEmit`.

---

### Implementation for User Story 4

- [ ] T014 [US4] Create `src/components/admin/orders/OrderDeleteAction.tsx` — delete button + AlertDialog confirmation.

  Full file content:
  ```tsx
  'use client';

  import { useState } from 'react';
  import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from '@/components/ui/alert-dialog';
  import { Button } from '@/components/ui/button';
  import { Loader2, Trash2 } from 'lucide-react';
  import { useAdminDeleteOrderMutation } from '@/hooks/admin/useAdminOrderMutations';

  interface OrderDeleteActionProps {
    orderId: string;   // order_number (string ID used by the API endpoints)
    onSuccess: () => void; // called after successful deletion (closes modal)
  }

  export function OrderDeleteAction({ orderId, onSuccess }: OrderDeleteActionProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const deleteMutation = useAdminDeleteOrderMutation();

    const handleConfirm = () => {
      deleteMutation.mutate(orderId, {
        onSuccess: () => {
          setDialogOpen(false);
          onSuccess(); // closes the modal
        },
      });
    };

    return (
      <div>
        <div className="text-sm font-medium text-foreground mb-3">Danger Zone</div>
        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive gap-2"
              onClick={() => setDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete Order
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive">
                Delete Order #{orderId}?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                This action is <span className="font-semibold text-foreground">permanent</span> and
                cannot be undone. The order and all its data will be removed from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                className="border-border"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirm}
                disabled={deleteMutation.isPending}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                {deleteMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting…</>
                ) : (
                  'Confirm Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }
  ```

**Checkpoint (US4)**: Open a modal. Click "Delete Order". Confirm. Verify order is removed from the list and modal closes. Cancel path makes no change. Run `npx tsc --noEmit`.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T015 [P] Verify the `'paid'` status badge color in `OrderStatusBadge.tsx` (T006) renders correctly. If `text-emerald-400` / `bg-emerald-500/20` are not available in the project's Tailwind config, replace with the  existing `success` token (`bg-success/20 text-success`) used by the `completed` badge.

- [ ] T016 [P] Verify empty state in `page.tsx` — when the orders list returns zero results (no orders match current filter/search), the table body must show a single full-width cell with the text "No orders found." already present in the existing `orders.length === 0` branch. Confirm it is still present after the refactor.

- [ ] T017 [P] Verify fallback for null/empty `user` field in `page.tsx` table rows — the `{order.user}` cell must render a fallback when `order.user` is empty:
  ```tsx
  {order.user || <span className="text-muted-foreground italic">Unknown</span>}
  ```
  Find the `TableCell` that renders `{order.user}` and apply this change.

- [ ] T018 [P] Verify the error state in `page.tsx` renders after the refactor — confirm the block:
  ```tsx
  {isError ? (
    <div className="text-center py-12 text-destructive text-sm">
      Failed to load orders. Please try again.
    </div>
  ) : (
  ```
  is present inside each `TabsContent`. If missing, add it back.

- [ ] T019 Run the full acceptance checklist in `specs/003-order-management-admin/quickstart.md`. Work through every item and check it off. Fix any failing items before marking this task done.

- [ ] T020 Run `npx tsc --noEmit` from `c:\iProjects\gimxa` and confirm zero TypeScript errors. Fix all errors before marking complete.

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (T001–T002): Type + Query Key patches
  └── Phase 2 (T003–T005): React Query hooks  [depends on Phase 1]
        └── Phase 3 (T006–T007): US1 List page refactor  [depends on Phase 2]
        └── Phase 4 (T008–T011): US2 Modal sub-components  [depends on Phase 2]
              └── Phase 5 (T012–T013): US3 Status Update panel  [depends on Phase 4 (T011)]
              └── Phase 6 (T014): US4 Delete action  [depends on Phase 4 (T011)]
                    └── Phase 7 (T015–T020): Polish  [depends on all stories]
```

### Parallel Opportunities

Within **Phase 1**: T001 and T002 can run in parallel (different files).

Within **Phase 2**: T003 and T004 can run in parallel (different files). T005 depends on T001 (extended type) but not on T003/T004.

Within **Phase 3**: T006 (badge extraction) can run in parallel with T007 (page refactor) — different files.

Within **Phase 4**: T008, T009, T010 can all run in parallel (different files). T011 depends on T008 + T009 + T010.

Within **Phase 7**: T015, T016, T017, T018 can all run in parallel.

### Story Independence

| Story | Depends On | Blocks |
|---|---|---|
| US1 — Browse & Filter Orders | Phase 2 hooks | — |
| US2 — View Order Detail | Phase 2 hooks | US3, US4 (modal shell T011) |
| US3 — Update Order Status | Phase 4 (T011 modal shell) | — |
| US4 — Delete Order | Phase 4 (T011 modal shell) | — |

---

## Parallel Example

```
# Phase 1 — run both in parallel:
T001: orders.ts type patch
T002: queryKeys.ts extension

# Phase 2 — run T003 + T004 in parallel (T005 after T001):
T003: useAdminOrdersQuery.ts
T004: useAdminOrderDetailQuery.ts
T005: useAdminOrderMutations.ts (after T001 complete)

# Phase 3 + 4 — after Phase 2, run in parallel across stories:
T006: OrderStatusBadge.tsx    ┐  (US1)
T007: page.tsx refactor       ┘  (US1)
T008: OrderDetailSummary.tsx  ┐
T009: OrderDetailItems.tsx    │  (US2 - parallel)
T010: OrderPaymentDetails.tsx ┘
# then T011 (depends on T008+T009+T010)

# Phase 5 + 6 — after T011:
T013: OrderStatusUpdate.tsx   (US3)
T014: OrderDeleteAction.tsx   (US4 - parallel with T013)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (T001–T002)
2. Complete Phase 2 (T003–T005)
3. Complete Phase 3 (T006–T007) — US1 list page only
4. **STOP and VALIDATE**: Navigate to `/dashboard/orders`, confirm all tabs work, URL params update, skeleton/error states render
5. Continue to Phase 4 once US1 is verified

### Incremental Delivery

1. Phase 1 + 2 → types + hooks ready
2. Phase 3 → Working list page with React Query (US1 MVP)
3. Phase 4 → Modal with correct sub-components, React Query detail fetch (US2)
4. Phase 5 → Status update with notification support (US3)
5. Phase 6 → Delete order (US4)
6. Phase 7 → Polish, final TypeScript gate, full smoke test

---

## Notes

- `useCacheClear` is at `src/hooks/admin/useCacheClear.ts` — do not recreate it.
- `orderService` is at `src/services/order.service.ts` — do not modify it.
- The API wraps paginated data inside `response.status`, not at the root level. The `useAdminOrdersQuery` hook handles this unwrapping — no other file needs to care.
- `success` and `warning` are Tailwind color tokens defined in this project. If they cause build errors, use `green-500`/`yellow-500` as fallbacks.
- Commit after each completed phase checkpoint.
- If Shadcn's `Switch`, `AlertDialog`, or `Collapsible` components are not yet installed, add them via `npx shadcn@latest add switch alert-dialog` before T013.
