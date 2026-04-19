# Research: Admin Order Management

**Feature**: 003-order-management-admin  
**Date**: 2026-04-18  
**Status**: Complete — no NEEDS CLARIFICATION items remain

---

## Decision Log

### D-01: Page Architecture — Full Refactor of Existing page.tsx

- **Decision**: Replace the entire `src/app/(admin)/dashboard/orders/page.tsx` with a React Query-driven implementation. The existing file uses raw `useState`/`useEffect` data fetching — a direct Constitution violation. The refactor introduces `useAdminOrdersQuery` (useQuery) with all filter/search/pagination params derived from URL search params via `useSearchParams`.
- **Rationale**: The existing page already has solid UI structure (Tabs for status filter, Table, Pagination, search Input). The refactor preserves all visual components but replaces the data layer entirely. Keeping the page file as the host avoids an unnecessary route restructure.
- **Alternatives considered**: Migrating to a Server Component with React Suspense — rejected because admin auth state (JWT stored in client memory) requires a Client Component context throughout.

---

### D-02: State Management for Filter/Search/Pagination — URL Search Params

- **Decision**: Filter (status tab), search query, and page number are encoded as URL search params (`?status=pending&search=foo&page=2`). The page reads them via `useSearchParams()` and passes them directly to the `useAdminOrdersQuery` query key and API params.
- **Rationale**: FR-015 mandates that filter/search/pagination state is preserved on navigation. URL params are the canonical zero-cost solution: browser back/forward works, links are shareable, and no Zustand/localStorage complexity is introduced. This matches the React Query v5 pattern used across Phases 1 and 2.
- **Alternatives considered**: Zustand store for filter state — rejected (Constitution §IV: Zustand is for transient client UI state only, not server-query parameters).

---

### D-03: React Query Strategy — useQuery for List + Detail; useMutation for Update/Delete

- **Decision**:
  - `useAdminOrdersQuery(params)` — fetches `/orders/admin/all` with full `AdminOrderListParams`. Query key: `['admin', 'orders', params]`.
  - `useAdminOrderDetailQuery(orderId)` — fetches `/orders/admin/{id}` only when a modal is open and `orderId` is non-empty. Query key: `['admin', 'order', orderId]`. Uses `enabled: !!orderId`.
  - `useAdminUpdateOrderMutation()` — PATCH `/orders/admin/{id}/`. On `onSuccess`: `cacheClear()` → `invalidateQueries(['admin', 'orders'])` + `invalidateQueries(['admin', 'order', id])`.
  - `useAdminDeleteOrderMutation()` — DELETE `/orders/admin/{id}/`. On `onSuccess`: `cacheClear()` → `invalidateQueries(['admin', 'orders'])`, then `onClose()` to dismiss the modal.
- **Rationale**: Granular query keys allow targeted invalidation. The detail query is lazily enabled only when needed (no wasted fetch on page load). Splitting update and delete into separate `useMutation` hooks keeps each hook focused and independently testable.
- **Alternatives considered**: Single combined mutation hook — rejected (violates Constitution §V: each hook must have a single clearly named responsibility).

---

### D-04: Type Gap — `AdminOrderUpdatePayload` Missing Notification Fields

- **Decision**: Extend `AdminOrderUpdatePayload` in `src/types/admin/orders.ts` with:
  ```
  send_notification?: boolean;
  notification_data?: { subject: string; message: string; email_type: string };
  ```
  This must be the first implementation task — all mutation hooks depend on this type.
- **Rationale**: Resolved in clarification session (Q1). The PLAN.md contract explicitly defines these fields. Passing them as untyped extras violates Constitution §II (no `any`, all payloads strictly typed).
- **Alternatives considered**: Separate `AdminOrderNotifyPayload` type merged at call site — rejected (unnecessary indirection; the single payload type is cleaner).

---

### D-05: Type Gap — `StatusOptions` Array Must Include `paid`

- **Decision**: The `STATUS_OPTIONS` constant in `OrderDetailsModal.tsx` currently omits `paid`. It must be updated to include all 6 statuses: `pending | paid | processing | completed | failed | cancelled`. The `TabStatus` type in `page.tsx` must also be extended to include `paid`.
- **Rationale**: Resolved in clarification session (Q2). `paid` is a first-class status in `OrderStatus` (just re-added to the type in the user's edit). Any UI that renders a status selector or filter must expose all 6 values.
- **Alternatives considered**: Derive `STATUS_OPTIONS` dynamically from the `OrderStatus` union — valid future improvement but out of scope for this phase.

---

### D-06: Modal Architecture — Full Rebuild of OrderDetailsModal

- **Decision**: Rebuild `OrderDetailsModal` around a `useAdminOrderDetailQuery` hook rather than the current `useEffect`/`useState` fetch pattern. Split the modal into focused sub-components under `src/components/admin/orders/`:
  - `OrderDetailSummary.tsx` — financial summary grid (order number, date, subtotal, tax, discount, total, coupon)
  - `OrderDetailItems.tsx` — order items list with top-up data display
  - `OrderPaymentDetails.tsx` — payment gateway card (conditional)
  - `OrderStatusUpdate.tsx` — status selector + "Send Notification" toggle + confirm dialog + update button
  - `OrderDeleteAction.tsx` — delete button + confirm dialog
- **Rationale**: The existing `OrderDetailsModal.tsx` is a 263-line single-file component — a direct Constitution §V violation. The sub-component split maps each visual section to its own file. `OrderDetailsModal.tsx` becomes a thin shell that assembles them.
- **Alternatives considered**: Keep the monolith and only add React Query — rejected (still a Constitution violation; componentization is mandatory).

---

### D-07: Notification UX — Collapsible Section within Status Update Panel

- **Decision**: The "Send Notification" toggle renders as a labeled checkbox/switch inside `OrderStatusUpdate.tsx`. When toggled ON, a Shadcn `Collapsible` reveals subject and message text inputs. The form uses React Hook Form + Zod for validation of the notification fields when the toggle is enabled.
- **Rationale**: FR-010 mandates that notification fields are only required when the toggle is enabled. Zod's `.superRefine()` or conditional `.when()` pattern cleanly handles the conditional requirement. React Hook Form is the Constitution-mandated form library.
- **Alternatives considered**: Uncontrolled inputs for notification fields — rejected (Constitution §Technical Stack: all user-facing forms require React Hook Form + Zod).

---

### D-08: Confirmation Dialogs — Shadcn AlertDialog

- **Decision**: Both status update and delete use Shadcn `AlertDialog` (not `Dialog`). AlertDialog is semantically correct for destructive/irreversible confirmations and has built-in keyboard trap and focus management. It blocks interaction with the parent modal until resolved.
- **Rationale**: FR-008 mandates a confirmation dialog before any mutation. `AlertDialog` is the accessible, semantically correct Shadcn primitive for this use case. It is also consistent with the code invalidation/deletion dialogs in Phase 2.
- **Alternatives considered**: Custom `Dialog`-based confirmation — rejected (AlertDialog is purpose-built for this; no reason to reimplement).

---

### D-09: Query Keys — Extend `adminQueryKeys`

- **Decision**: Add to `src/hooks/admin/queryKeys.ts`:
  ```
  orders: (params: AdminOrderListParams) => ['admin', 'orders', params] as const,
  order:  (id: string) => ['admin', 'order', id] as const,
  ```
- **Rationale**: Centralizing query keys in `adminQueryKeys` prevents string literal drift between query and invalidation call sites. Follows the exact pattern already established for products, topups, and packages.
- **Alternatives considered**: Inline string arrays at each call site — rejected (drift risk; harder to audit).

---

### D-10: Existing Asset Inventory

| Asset | Path | Action |
|---|---|---|
| `AdminOrder` type | `src/types/admin/orders.ts` | Reuse as-is |
| `AdminOrderDetail` type | `src/types/admin/orders.ts` | Reuse as-is |
| `AdminOrderItem` type | `src/types/admin/orders.ts` | Reuse as-is |
| `AdminOrderUpdatePayload` | `src/types/admin/orders.ts` | **EXTEND**: add `send_notification?`, `notification_data?` |
| `AdminOrderListParams` | `src/types/admin/orders.ts` | Reuse as-is |
| `OrderStatus` | `src/types/admin/orders.ts` | Already updated by user (includes `paid`) |
| `orderService.adminOrdersList` | `src/services/order.service.ts` | Reuse as-is |
| `orderService.adminOrderDetails` | `src/services/order.service.ts` | Reuse as-is |
| `orderService.adminUpdateOrder` | `src/services/order.service.ts` | Reuse as-is |
| `orderService.adminDeleteOrder` | `src/services/order.service.ts` | Reuse as-is |
| `useCacheClear` | `src/hooks/admin/useCacheClear.ts` | Reuse directly |
| `adminQueryKeys` | `src/hooks/admin/queryKeys.ts` | **EXTEND**: add `orders` + `order` keys |
| `OrderDetailsModal.tsx` | `src/components/admin/modals/` | **REBUILD**: convert to React Query shell + sub-components |
| `page.tsx` (orders) | `src/app/(admin)/dashboard/orders/` | **REFACTOR**: replace useEffect/useState data layer with React Query |
| `OrderStatusBadge` (in page.tsx) | `src/app/(admin)/dashboard/orders/page.tsx` | **EXTRACT** to `src/components/admin/orders/OrderStatusBadge.tsx` |

---

### D-11: Cache-Clear + Invalidation Query Keys

| Mutation | `clearCache()` | Query Keys Invalidated |
|---|---|---|
| Update order status | ✅ | `['admin', 'orders', *]` + `['admin', 'order', id]` |
| Delete order | ✅ | `['admin', 'orders', *]` |
