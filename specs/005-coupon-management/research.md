# Research: Coupon Management (Phase 5)

**Generated**: 2026-04-20  
**Feature**: `specs/005-coupon-management/spec.md`  
**Status**: Complete — all NEEDS CLARIFICATION resolved

---

## 1. React Query Key Strategy

**Decision**: Use a three-tier key hierarchy:
- `['admin', 'coupons']` — list of all coupons (`adminCouponsList`)
- `['admin', 'coupons', id]` — single coupon detail (`adminGetCouponDetail`)
- `['admin', 'coupons', id, 'usages']` — per-coupon usage history (`adminCouponUsages`)
- `['admin', 'coupons', id, 'scope']` — resource attachments per coupon (derived from coupon detail)

**Rationale**: Hierarchical keys allow precise invalidation — invalidating `['admin', 'coupons']` refreshes the list without clearing individual detail caches; invalidating `['admin', 'coupons', id]` cascades to detail + usages when needed.

**Alternatives considered**: Flat keys (`['coupons-list']`, `['coupon-detail', id]`) — rejected because they require manual cross-key invalidation on every mutation.

---

## 2. Cache-Clear Hook Pattern (Mandatory per Constitution)

**Decision**: Every `onSuccess` callback in a `useMutation` for coupon mutations MUST follow:
```
onSuccess: async () => {
  await authService.clearCache();           // Step 1: Django backend cache
  queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] }); // Step 2: React Query
}
```

**Rationale**: Consistent with Phases 1–4; the Django cache is authoritative for pricing/availability. This 2-step pattern is mandated by the project constitution and PLAN.md.

**Alternatives considered**: Skipping `clearCache()` for toggle-only mutations — rejected. Constitution mandates it for ALL writes.

---

## 3. Zod Schema Design for Coupon Form

**Decision**: One shared Zod schema covers both Create and Update, with `.superRefine` for cross-field validations:

```typescript
const couponSchema = z.object({
  code: z.string().min(1).max(50).regex(/^[A-Z0-9_-]+$/),
  scope: z.enum(['global(order)', 'product', 'package', 'category']),
  discount_type: z.enum(['percent', 'fixed']),
  discount_value: z.number().positive(),
  start_at: z.string().datetime(),
  end_at: z.string().datetime(),
  max_usage: z.number().int().positive().optional(),
  is_active: z.boolean().default(true),
}).superRefine((data, ctx) => {
  if (data.discount_type === 'percent' && data.discount_value > 100) {
    ctx.addIssue({ code: 'too_big', path: ['discount_value'], message: 'Max 100 for percent' });
  }
  if (data.end_at <= data.start_at) {
    ctx.addIssue({ code: 'custom', path: ['end_at'], message: 'End date must be after start date' });
  }
});
```

**Rationale**: `superRefine` handles cross-field validation (discount cap, date ordering) cleanly within a single schema pass.

**Alternatives considered**: Separate create/update schemas — rejected as redundant; the only difference is Code being read-only on edit, which is a UI concern (disabled input), not a schema concern.

---

## 4. Status Computation (Client-Side)

**Decision**: A pure utility function `computeCouponStatus(coupon: AdminCoupon): 'active' | 'upcoming' | 'expired' | 'inactive'` declared in `src/lib/utils/coupon-status.ts`:

```
- 'expired'  → end_at < now  (takes priority over is_active)
- 'upcoming' → start_at > now (takes priority over is_active)
- 'active'   → is_active=true AND start_at ≤ now AND end_at ≥ now
- 'inactive' → is_active=false AND not expired AND not upcoming
```

**Rationale**: Pure function is trivially testable without mocking React state. Centralizes display logic so list filters and status badges use the same source.

**Alternatives considered**: Inline ternaries in JSX — rejected; hard to keep consistent across list/badge/filter. Deriving from a separate API field — rejected; no such field exists.

---

## 5. Resource Picker Architecture

**Decision**: Scope-conditional picker components:
- When `scope = 'product'` → `CouponProductPicker` using `catalogService.adminProductsList()`
- When `scope = 'category'` → `CouponCategoryPicker` using `catalogService.adminCategoriesList()`
- When `scope = 'package'` → `CouponPackagePicker` using `topupService.adminPackagesList()` (requires a topup slug — must fetch all topups first via `topupService.adminTopupsList()`)
- When `scope = 'global(order)'` → no picker shown

**Each picker pattern**:
1. `useQuery` to load full resource list
2. Combobox/search input to filter by name
3. Checkboxes or row-select for multi-selection
4. "Add selected" fires `adminAdd<Resource>ToCoupon({ resource_ids: selectedIds })` as a `useMutation`
5. Current scoped resources shown in an attached table with per-row "Remove" button (individual DELETE mutation)

**Rationale**: Reuses existing service methods — no new endpoints needed (per clarification Q4). Package picker requires topup context since packages are nested under topups; fetching all topups then flattening packages is the simplest approach given the current API.

**Alternatives considered**: Shared generic `ResourcePicker` component — considered but different data shapes (products vs categories vs packages) make a single generic too complex. Scope-specific components with shared base layout is cleaner.

---

## 6. Edit Page Architecture — Tabs vs Dialog

**Decision**: Coupon edit uses a **dedicated edit page** at `/dashboard/coupons/[id]/edit` with a **tabbed layout**:
- **Tab 1**: Details (Code, Scope, Discount, Dates, Max Usage, Active toggle)
- **Tab 2**: Scoping (visible only when `scope ≠ 'global(order)'`) — resource picker + current scope list
- **Tab 3**: Usage History — read-only redemption table

The Create action remains a **Dialog** (FR-003 says "creation form"; keeping create lightweight is consistent with Phase 1–4 patterns).

**Rationale**: The Scoping tab and Usage History tab require their own `useQuery` calls and potentially large lists — embedding all of this in a Dialog would create a heavy modal. A dedicated page is the clean Next.js App Router pattern.

**Alternatives considered**: All in Dialog — rejected; Dialog with 3 tabs and large data tables is poor UX on mobile. Separate page per tab — rejected; tabbed single-page is the standard admin pattern.

---

## 7. adminDeleteCoupon Service Method

**Decision**: Add to `coupon.service.ts`:
```typescript
adminDeleteCoupon: async (id: string | number) => {
  const { data } = await api.delete(`/coupons/admin/coupon/${id}/`);
  return data;
},
```

**Rationale**: The DELETE endpoint is confirmed to exist (clarification Q3). The service is missing this method and must be added before the delete UI can be wired up.

**Alternatives considered**: None — straightforward REST DELETE following existing service patterns.

---

## 8. Component File Structure

**Decision**: Feature-first under `src/components/features/coupons/`:

```
src/components/features/coupons/
├── CouponListFilters.tsx         # Status tab filter bar
├── CouponListTable.tsx           # Data table with action buttons
├── CouponTableRow.tsx            # Single row (status badge, toggle, actions)
├── CouponStatusBadge.tsx         # Reusable status badge derived from computeCouponStatus()
├── CouponCreateDialog.tsx        # Create form in Dialog
├── CouponEditForm.tsx            # Edit form (Details tab content)
├── CouponScopingTab.tsx          # Scoping tab orchestrator (renders correct picker)
├── CouponProductPicker.tsx       # Product scope picker
├── CouponCategoryPicker.tsx      # Category scope picker
├── CouponPackagePicker.tsx       # Package scope picker
├── CouponUsageModal.tsx          # Usage history modal
├── CouponDeleteDialog.tsx        # Confirmation dialog for delete
└── coupon-schema.ts              # Shared Zod schema + TypeScript inferred types
```

**Page files**:
```
src/app/(admin)/dashboard/coupons/
├── page.tsx                      # List page (refactored to React Query)
└── [id]/
    └── edit/
        └── page.tsx              # Edit page with tabbed layout
```

**Rationale**: Constitution V mandates no megacomponents; each file has one responsibility. The existing `page.tsx` must be refactored from raw `useState`/`useEffect` to React Query.

---

## 9. TypeScript Types Alignment

**Decision**: The canonical types for this feature live in `src/types/admin/coupons.ts` (already updated by the user). The `src/types/coupon.ts` has overlapping definitions that must be reconciled — `AdminCouponPayload` in `coupon.ts` should either re-export from `admin/coupons.ts` or be consolidated. For now, `coupon.service.ts` should import from `@/types/admin/coupons` to use the most up-to-date definitions.

**Key confirmed fields**:

| Field | Type | Notes |
|-------|------|-------|
| `id` | `number` | Read-only |
| `code` | `string` | Unique, uppercase, read-only after create |
| `scope` | `'global(order)' \| 'product' \| 'package' \| 'category'` | Required |
| `discount_type` | `'percent' \| 'fixed'` | Required |
| `discount_value` | `number` | Required, positive |
| `is_active` | `boolean` | Toggleable |
| `start_at` | `string` (ISO datetime) | Required |
| `end_at` | `string` (ISO datetime) | Required |
| `max_usage` | `number \| undefined` | Optional |
| `used_count` | `number \| undefined` | Read-only |
| `created_at` | `string \| undefined` | Read-only |

---

## 10. Existing Page Refactor Scope

**Decision**: The existing `src/app/(admin)/dashboard/coupons/page.tsx` (390 lines, all `useState`/`useEffect`) must be **fully replaced** with React Query patterns. This is the first task in implementation. The existing file violates Constitution III and must not be preserved.

**Rationale**: Constitution III is NON-NEGOTIABLE. Raw `useEffect`/`useState` for data fetching is explicitly forbidden.

**Alternatives considered**: Incremental migration — rejected; the existing file is 390 lines of one monolithic component. Full replacement to feature-first components is cleaner and faster.
