# Quickstart: Admin Order Management

**Feature**: 003-order-management-admin  
**Date**: 2026-04-18

---

## What Is Being Built

A full refactor and feature expansion of the admin Orders module. The existing `page.tsx` uses illegal `useEffect`/`useState` data fetching (Constitution violation). This phase replaces it with a fully React Query-driven implementation and extends the detail modal with typed status update mutations (including optional customer notification emails), a confirmation-gated delete action, componentized sub-views, and a correct 7-tab status filter that includes `paid`.

---

## Implementation Order (Strict)

Follow this order precisely — each step unblocks the next:

```
Step 1: Type patch           → Extend AdminOrderUpdatePayload (notification fields)
Step 2: Query keys           → Add orders/order keys to adminQueryKeys
Step 3: Service audit        → Confirm orderService endpoints match AdminOrderListParams
Step 4: Query hooks          → useAdminOrdersQuery + useAdminOrderDetailQuery
Step 5: Mutation hooks       → useAdminUpdateOrderMutation + useAdminDeleteOrderMutation
Step 6: Shared component     → OrderStatusBadge (extracted, shared by page + modal)
Step 7: Modal sub-components → OrderDetailSummary, OrderDetailItems, OrderPaymentDetails
Step 8: Status update panel  → OrderStatusUpdate (form, toggle, notification fields, AlertDialog)
Step 9: Delete action        → OrderDeleteAction (AlertDialog, useMutation)
Step 10: Modal shell         → Rebuild OrderDetailsModal using all sub-components + React Query
Step 11: Page refactor       → Rebuild orders page.tsx with useAdminOrdersQuery + URL params
Step 12: Smoke test          → Verify all acceptance scenarios manually
```

---

## Key Files

### Modified
| File | Change |
|---|---|
| `src/types/admin/orders.ts` | Extend `AdminOrderUpdatePayload` with notification fields |
| `src/hooks/admin/queryKeys.ts` | Add `orders(params)` and `order(id)` entries |
| `src/components/admin/modals/OrderDetailsModal.tsx` | Rebuild as React Query shell + sub-components |
| `src/app/(admin)/dashboard/orders/page.tsx` | Replace useEffect/useState data layer with React Query |

### New
| File | Purpose |
|---|---|
| `src/hooks/admin/useAdminOrdersQuery.ts` | `useQuery` for paginated orders list |
| `src/hooks/admin/useAdminOrderDetailQuery.ts` | `useQuery` for single order detail (enabled when modal open) |
| `src/hooks/admin/useAdminOrderMutations.ts` | `useMutation` for update + delete |
| `src/components/admin/orders/OrderStatusBadge.tsx` | Shared badge (used by page table + modal) |
| `src/components/admin/orders/OrderDetailSummary.tsx` | Financial summary grid section in modal |
| `src/components/admin/orders/OrderDetailItems.tsx` | Order items list section in modal |
| `src/components/admin/orders/OrderPaymentDetails.tsx` | Payment info card section in modal |
| `src/components/admin/orders/OrderStatusUpdate.tsx` | Status selector + notification toggle + AlertDialog |
| `src/components/admin/orders/OrderDeleteAction.tsx` | Delete button + AlertDialog |

---

## Critical Patterns

### React Query — List Query
```typescript
// src/hooks/admin/useAdminOrdersQuery.ts
export function useAdminOrdersQuery(params: AdminOrderListParams) {
  return useQuery({
    queryKey: adminQueryKeys.orders(params),
    queryFn: async () => {
      const data = await orderService.adminOrdersList(params);
      // Unwrap: response.status contains the paginated payload
      return data.status as PaginatedOrdersResult;
    },
    placeholderData: keepPreviousData,
  });
}
```

### React Query — Detail Query
```typescript
// src/hooks/admin/useAdminOrderDetailQuery.ts
export function useAdminOrderDetailQuery(orderId: string) {
  return useQuery({
    queryKey: adminQueryKeys.order(orderId),
    queryFn: () => orderService.adminOrderDetails(orderId),
    enabled: !!orderId,
  });
}
```

### Mutation — Status Update (with cache-clear)
```typescript
// src/hooks/admin/useAdminOrderMutations.ts
export function useAdminUpdateOrderMutation() {
  const queryClient = useQueryClient();
  const cacheClear = useCacheClear();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdminOrderUpdatePayload }) =>
      orderService.adminUpdateOrder(id, payload),
    onSuccess: async (_, { id }) => {
      await cacheClear();
      await queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.order(id) });
      toast.success('Order status updated.');
    },
    onError: () => toast.error('Failed to update order status.'),
  });
}
```

### Mutation — Delete Order (with cache-clear)
```typescript
export function useAdminDeleteOrderMutation() {
  const queryClient = useQueryClient();
  const cacheClear = useCacheClear();
  return useMutation({
    mutationFn: (id: string) => orderService.adminDeleteOrder(id),
    onSuccess: async () => {
      await cacheClear();
      await queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      toast.success('Order deleted.');
    },
    onError: () => toast.error('Failed to delete order.'),
  });
}
```

### URL Search Params Pattern (page.tsx)
```typescript
// In page.tsx — NO useState/useEffect for data fetching
const searchParams = useSearchParams();
const router = useRouter();
const pathname = usePathname();

const status = (searchParams.get('status') ?? 'all') as TabStatus;
const search  = searchParams.get('search') ?? '';
const page    = Number(searchParams.get('page') ?? '1');

const { data, isPending, isError } = useAdminOrdersQuery({
  status: status === 'all' ? undefined : status,
  search: search || undefined,
  page,
  page_size: PAGE_SIZE,
});

// Updating filters:
const updateParams = (updates: Record<string, string | null>) => {
  const params = new URLSearchParams(searchParams.toString());
  Object.entries(updates).forEach(([k, v]) => {
    if (v === null) params.delete(k); else params.set(k, v);
  });
  router.push(`${pathname}?${params.toString()}`);
};
```

---

## Acceptance Test Checklist

Run through these manually before marking Phase 3 complete:

- [ ] Orders list loads with pagination (page, total pages, total count visible)
- [ ] Tab "All Orders" shows all orders; each status tab filters correctly including "Paid"
- [ ] Search by username filters the table (with 400ms debounce via URL param update)
- [ ] Clicking a row opens the detail modal; `isPending` skeleton shows while loading
- [ ] Detail modal shows: order number, date, status badge, subtotal, tax, discount, total, items, topup_data, payment details
- [ ] Status selector in modal shows all 6 statuses
- [ ] Selecting a new status and confirming the AlertDialog updates the order; list table refreshes
- [ ] Toggling "Send Notification" reveals subject + message fields; submitting includes notification payload
- [ ] Dismissing the status update AlertDialog makes no change
- [ ] Clicking "Delete Order" and confirming removes the order from the list; modal closes
- [ ] Dismissing the delete AlertDialog makes no change
- [ ] Error states visible for failed list load and failed modal detail load
- [ ] Empty state message shown when no orders match filter/search
- [ ] URL reflects current tab/search/page (browser back restores state)
- [ ] Zero TypeScript errors (`tsc --noEmit` passes)
- [ ] No `useEffect`/`useState` data fetching remains in orders module
