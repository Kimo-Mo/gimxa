# Implementation Plan: Coupon Management (Phase 5)

**Branch**: `005-coupon-management` | **Date**: 2026-04-20 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/005-coupon-management/spec.md`

---

## Summary

Build the full Coupon Management admin module: a refactored list page (replacing the existing 390-line `useState`/`useEffect` monolith), a create dialog, a tabbed edit page (Details / Scoping / Usage History), and scope-conditional resource pickers backed by `catalogService` and `topupService`. All reads use `useQuery`; all writes use `useMutation` with the mandatory two-step cache-clear hook. The existing `coupon.service.ts` needs one addition (`adminDeleteCoupon`) and an import alignment to use the confirmed `@/types/admin/coupons` schema.

---

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode, zero `any`)  
**Primary Dependencies**: Next.js 15 (App Router), TanStack React Query v5, React Hook Form, Zod, Shadcn/Radix UI, Tailwind CSS 4, Axios  
**Storage**: N/A (stateless frontend; backend is Django)  
**Testing**: TypeScript compiler (zero errors gate); manual UI verification per acceptance scenarios  
**Target Platform**: Web browser — admin dashboard at `/dashboard/coupons`  
**Project Type**: Web application (Next.js admin frontend)  
**Performance Goals**: List page loads within 1 second; mutations reflect within 2 seconds (SC-002, SC-005)  
**Constraints**: All mutations must call `authService.clearCache()` before `queryClient.invalidateQueries`; no `useEffect`/`useState` data-fetching; fully responsive 375px–1440px  
**Scale/Scope**: Single admin module; ~18 component/utility files; ~12 mutation operations; ~6 query operations

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Gate | Status |
|---|------|--------|
| 1 | **Output Discipline** — No large code blocks in chat; all changes go directly to files with 2–3 sentence summaries | ✅ |
| 2 | **TypeScript Strictness** — All props, state, and payloads typed; zero `any` usage; Zod schemas for API responses | ✅ |
| 3 | **React Query** — All fetches use `useQuery`; all mutations use `useMutation` + `queryClient.invalidateQueries` on success | ✅ |
| 4 | **Zustand Scope** — Stores cover client-only transient state only; no server data stored in Zustand | ✅ |
| 5 | **Componentization** — No single-file megacomponents; features colocated under `src/components/features/coupons/` | ✅ |
| 6 | **Axios Instance** — All HTTP calls go through the configured `api` instance; no raw fetch or parallel refresh logic | ✅ |
| 7 | **Graceful Degradation** — Every query/mutation handles `isPending`, `isError`, and empty states; no raw errors shown to users | ✅ |
| 8 | **Data Integrity** — Pricing, permissions, and statuses sourced from backend responses only; no client-side recalculation | ✅ |
| 9 | **Tailwind Only** — No inline `style` props or external CSS files outside global reset; fully responsive (Mobile/Tablet/Desktop) | ✅ |

> **Gate 2 Note**: The existing `page.tsx` uses `useState`/`useEffect` — Gate 3 is currently violated in the existing file. This plan mandates full replacement as the first implementation task. Post-implementation, all gates must be ✅.

---

## Project Structure

### Documentation (this feature)

```text
specs/005-coupon-management/
├── plan.md              ← This file
├── research.md          ← Phase 0 output ✅
├── data-model.md        ← Phase 1 output ✅
├── quickstart.md        ← Phase 1 output ✅
├── contracts/
│   └── api-contracts.md ← Phase 1 output ✅
├── checklists/
│   └── requirements.md
└── tasks.md             ← Phase 2 output (/speckit-tasks command)
```

### Source Code Layout

```text
src/
├── services/
│   └── coupon.service.ts          ← Add adminDeleteCoupon; fix imports
│
├── types/
│   └── admin/
│       └── coupons.ts             ← Already updated (confirmed schema)
│
├── lib/
│   └── utils/
│       └── coupon-status.ts       ← NEW: computeCouponStatus() pure utility
│
└── components/
    └── features/
        └── coupons/               ← NEW feature directory
            ├── coupon-schema.ts   ← Zod schema + CouponFormValues type
            ├── couponKeys.ts      ← React Query key registry
            ├── CouponStatusBadge.tsx
            ├── CouponListFilters.tsx
            ├── CouponListTable.tsx
            ├── CouponTableRow.tsx
            ├── CouponCreateDialog.tsx
            ├── CouponEditForm.tsx
            ├── CouponScopingTab.tsx
            ├── CouponProductPicker.tsx
            ├── CouponCategoryPicker.tsx
            ├── CouponPackagePicker.tsx
            ├── CouponUsageModal.tsx
            └── CouponDeleteDialog.tsx

src/app/(admin)/dashboard/coupons/
├── page.tsx                       ← REFACTOR (replace useState/useEffect)
└── [id]/
    └── edit/
        └── page.tsx               ← NEW: tabbed edit page
```

**Structure Decision**: Single Next.js project (Option 1). Admin features live under `src/app/(admin)/dashboard/`. Components colocated in `src/components/features/coupons/` per Constitution V.

---

## Complexity Tracking

> No constitution violations requiring justification. All gates pass by design.

---

## Phase 0: Research Findings

See [`research.md`](./research.md) for full decision log. Key resolutions:

| Decision | Resolution |
|----------|-----------|
| React Query key strategy | 3-tier hierarchy: `['admin','coupons']`, `['admin','coupons',id]`, `['admin','coupons',id,'usages']` |
| Status computation | Client-side pure function `computeCouponStatus()` — expired > upcoming > active > inactive |
| Zod schema | Single shared schema with `superRefine` for percent-cap and date-order cross-field validation |
| Edit page architecture | Dedicated `/coupons/[id]/edit` page with 3 tabs; Create stays as Dialog |
| Resource picker data | `catalogService.adminProductsList()`, `catalogService.adminCategoriesList()`, `topupService.adminPackagesList()` |
| Existing page | Full replacement — 390-line `useState`/`useEffect` monolith violates Constitution III |
| Delete endpoint | Confirmed; add `adminDeleteCoupon(id)` method to `coupon.service.ts` |

---

## Phase 1: Design & Contracts

See [`data-model.md`](./data-model.md) and [`contracts/api-contracts.md`](./contracts/api-contracts.md).

### Key Design Decisions

**Coupon form (Create + Edit)**:
- One Zod schema (`couponFormSchema`) with `.superRefine` for cross-field rules
- Code field: uppercase-forced input, disabled on edit
- Scope selector: drives visibility of the Scoping tab
- Date fields: datetime-local inputs, transformed to ISO strings for API
- `max_usage` optional; empty input = unlimited

**List page**:
- `useQuery({ queryKey: couponKeys.all, queryFn: ... })` for all coupons
- Client-side filter tabs (All / Active / Upcoming / Expired) using `computeCouponStatus()`
- Each row contains: Code (mono), Scope badge, Discount, Dates, Used/Max, Status badge, Actions (Edit, Usage, Delete)
- Toggle button fires `useMutation` with `adminUpdateCoupon(id, { ...coupon, is_active: !coupon.is_active })`

**Edit page tabs**:
1. **Details tab**: Pre-filled form with `adminGetCouponDetail(id)` → `useQuery`; Save fires `adminUpdateCoupon`
2. **Scoping tab** (hidden for `global(order)` scope): Picker + current scope list; each add/remove is its own `useMutation`
3. **Usage tab**: `adminCouponUsages(id)` → `useQuery`; read-only table in same page context (no separate modal needed from edit page)

**Usage history from list page**:
- `CouponUsageModal` dialog: opened from list row "Usage" icon
- `useQuery` fires only when modal is open (`enabled: !!selectedCouponId`)

**Resource picker UX**:
- Fetches full resource list via `useQuery`
- Filters via controlled search input (client-side for now since lists are likely small)
- Multi-select checkboxes → "Add Selected" button → batch `resource_ids` POST
- Per-row "Remove" button → individual DELETE mutation
