# Quickstart: Coupon Management (Phase 5)

**Generated**: 2026-04-20  
**For**: Implementers executing `/speckit-implement`

---

## Prerequisites

- Phases 1–4 complete (React Query architecture established; `authService.clearCache()` pattern in use)
- Backend running with coupon endpoints active
- `src/types/admin/coupons.ts` already updated (confirmed schema: `is_active`, `start_at`, `end_at`, `max_usage`, `used_count`, `scope`)

---

## Implementation Order

Follow this dependency order to avoid blocked work:

```
1. coupon.service.ts          ← Add adminDeleteCoupon; fix imports to use @/types/admin/coupons
2. coupon-schema.ts           ← Zod schema + CouponFormValues type
3. coupon-status.ts           ← Pure utility: computeCouponStatus()
4. couponKeys.ts              ← React Query key registry
5. CouponStatusBadge.tsx      ← Stateless display component
6. CouponCreateDialog.tsx     ← Create form (depends on schema + service)
7. CouponTableRow.tsx         ← Row with toggle + action buttons
8. CouponListFilters.tsx      ← Status tab bar
9. CouponListTable.tsx        ← Table shell (uses Row + Filters)
10. coupons/page.tsx           ← Refactored list page (replaces 390-line useState/useEffect)
11. CouponEditForm.tsx         ← Details tab form
12. CouponProductPicker.tsx    ← Product scope picker
13. CouponCategoryPicker.tsx   ← Category scope picker
14. CouponPackagePicker.tsx    ← Package scope picker
15. CouponScopingTab.tsx       ← Scope tab orchestrator
16. CouponUsageModal.tsx       ← Usage history modal
17. CouponDeleteDialog.tsx     ← Delete confirmation
18. coupons/[id]/edit/page.tsx ← Edit page with tabs
```

---

## Key File Locations

| File | Path |
|------|------|
| Feature types | `src/types/admin/coupons.ts` |
| Service | `src/services/coupon.service.ts` |
| Zod schema | `src/components/features/coupons/coupon-schema.ts` |
| Status util | `src/lib/utils/coupon-status.ts` |
| Query keys | `src/components/features/coupons/couponKeys.ts` |
| Components | `src/components/features/coupons/` |
| List page | `src/app/(admin)/dashboard/coupons/page.tsx` |
| Edit page | `src/app/(admin)/dashboard/coupons/[id]/edit/page.tsx` |

---

## Cache-Clear Pattern (Mandatory on Every Mutation)

```typescript
const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: (payload) => couponService.someWriteMethod(payload),
  onSuccess: async () => {
    await authService.clearCache();                              // Step 1
    queryClient.invalidateQueries({ queryKey: couponKeys.all }); // Step 2
  },
  onError: (error) => {
    toast.error('Descriptive error message here');
  },
});
```

---

## Status Computation Utility

```typescript
// src/lib/utils/coupon-status.ts
import type { AdminCoupon } from '@/types/admin/coupons';

export type CouponDisplayStatus = 'active' | 'upcoming' | 'expired' | 'inactive';

export function computeCouponStatus(coupon: AdminCoupon): CouponDisplayStatus {
  const now = new Date();
  const start = new Date(coupon.start_at);
  const end = new Date(coupon.end_at);

  if (end < now) return 'expired';
  if (start > now) return 'upcoming';
  if (coupon.is_active) return 'active';
  return 'inactive';
}
```

---

## Scope UI Rule

```typescript
// Show Scoping tab only for non-global coupons
const showScopingTab = coupon.scope !== 'global(order)';
```

---

## Constitution Gates to Verify Before PR

- [ ] Zero `useEffect`/`useState` data-fetching patterns in any new/refactored file
- [ ] Zero `any` types — all API responses typed via `AdminCoupon`, `AdminCouponUsage`, etc.
- [ ] Every `useMutation.onSuccess` calls `authService.clearCache()` THEN `queryClient.invalidateQueries`
- [ ] All loading states show `<Skeleton>` components
- [ ] All error states show toast (never raw error to UI)
- [ ] `api` Axios instance used for all HTTP calls (no raw `fetch`)
- [ ] No inline `style` props — Tailwind only
- [ ] No single component file over ~150 lines; break into sub-components if needed
- [ ] Fully responsive (test at 375px, 768px, 1440px)
