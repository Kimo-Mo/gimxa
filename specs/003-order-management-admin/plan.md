# Implementation Plan: Admin Order Management

**Branch**: `003-order-management-admin` | **Date**: 2026-04-18 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/003-order-management-admin/spec.md`

## Summary

Full refactor and expansion of the admin Orders module. The existing `page.tsx` uses `useEffect`/`useState` data fetching (Constitution violation) and the `OrderDetailsModal` is a 263-line monolith — both must be replaced. This phase: (1) patches the `AdminOrderUpdatePayload` type with notification fields, (2) extends `adminQueryKeys`, (3) creates focused `useQuery`/`useMutation` hooks, (4) decomposes the modal into typed sub-components, and (5) rebuilds the page with URL-param-driven filtering, a 7-tab status strip (including `paid`), and mandatory cache-clear + invalidation on every write.

## Technical Context

**Language/Version**: TypeScript 5 / Next.js 16 (App Router)  
**Primary Dependencies**: TanStack React Query v5, Axios (`api` instance), React Hook Form, Zod, Shadcn UI, Tailwind CSS 4, Sonner (toast)  
**Storage**: N/A (frontend only; backend is Django REST Framework)  
**Testing**: TypeScript compiler (`tsc --noEmit`) as primary gate; manual smoke test per acceptance scenario in quickstart.md  
**Target Platform**: Admin dashboard web — all orders pages are Client Components (JWT auth in client memory)  
**Project Type**: Web application — admin dashboard module refactor + feature expansion  
**Performance Goals**: Orders list loads within 3 s (SC-002); status update reflects within 2 s (SC-004)  
**Constraints**: Zero `useEffect`/`useState` for data fetching; zero `any`; cache-clear hook mandatory on every `onSuccess`; all mutations gated by confirmation dialog  
**Scale/Scope**: Server-side paginated list (10 orders/page); detail modal loads one order at a time

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Gate | Status |
|---|------|--------|
| 1 | **Output Discipline** — No large code blocks in chat; all changes go directly to files with 2–3 sentence summaries | ✅ |
| 2 | **TypeScript Strictness** — All props, state, and payloads typed; zero `any`; Zod schema for status update form | ✅ — `AdminOrderUpdatePayload` extended; Zod schema defined in data-model.md |
| 3 | **React Query** — All fetches use `useQuery`; all mutations use `useMutation` + `queryClient.invalidateQueries` on success | ✅ — `useAdminOrdersQuery`, `useAdminOrderDetailQuery`, `useAdminUpdateOrderMutation`, `useAdminDeleteOrderMutation` |
| 4 | **Zustand Scope** — Stores cover client-only transient state only; no server data in Zustand | ✅ — URL search params used for filter/search/page state; no Zustand store introduced |
| 5 | **Componentization** — No single-file megacomponents; features colocated under `src/components/admin/orders/` | ✅ — Modal split into 5 sub-components; `OrderStatusBadge` extracted from page |
| 6 | **Axios Instance** — All HTTP calls go through `api` instance via `orderService` | ✅ — all calls route through existing `orderService` which uses `api` |
| 7 | **Graceful Degradation** — Every query/mutation handles `isPending`, `isError`, and empty states | ✅ — skeleton loading, empty-state message, toast errors on mutation failure |
| 8 | **Data Integrity** — Order totals, status, and prices sourced from backend only; no client-side recalculation | ✅ — all monetary values displayed from API string fields via `parseFloat().toFixed(2)` |
| 9 | **Tailwind Only** — No inline `style` props; fully responsive | ✅ |

**Post-Design Re-check**: All gates pass. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/003-order-management-admin/
├── plan.md              ← this file
├── research.md          ← Phase 0 complete
├── data-model.md        ← Phase 1 complete
├── quickstart.md        ← Phase 1 complete
└── tasks.md             ← Phase 2 output (/speckit-tasks)
```

### Source Code Changes

```text
src/
├── types/admin/
│   └── orders.ts                              ← PATCH: extend AdminOrderUpdatePayload
│
├── hooks/admin/
│   ├── queryKeys.ts                           ← PATCH: add orders(params) + order(id) keys
│   ├── useAdminOrdersQuery.ts                 ← NEW: useQuery for paginated admin orders list
│   ├── useAdminOrderDetailQuery.ts            ← NEW: useQuery for single order detail (enabled guard)
│   └── useAdminOrderMutations.ts              ← NEW: useAdminUpdateOrderMutation + useAdminDeleteOrderMutation
│
└── components/admin/
    ├── orders/                                ← NEW directory
    │   ├── OrderStatusBadge.tsx               ← NEW: extracted shared status badge (6 statuses incl. paid)
    │   ├── OrderDetailSummary.tsx             ← NEW: financial summary grid (number, date, prices, coupon)
    │   ├── OrderDetailItems.tsx               ← NEW: order items list with top-up field display
    │   ├── OrderPaymentDetails.tsx            ← NEW: payment gateway card (conditional render)
    │   ├── OrderStatusUpdate.tsx              ← NEW: status selector + Send Notification toggle + AlertDialog
    │   └── OrderDeleteAction.tsx              ← NEW: Delete Order button + AlertDialog confirmation
    │
    └── modals/
        └── OrderDetailsModal.tsx              ← REBUILD: thin shell using sub-components + useAdminOrderDetailQuery

src/app/(admin)/dashboard/orders/
└── page.tsx                                   ← REFACTOR: replace useEffect/useState with useAdminOrdersQuery
                                                            add paid tab, URL param state, extract OrderStatusBadge
```
