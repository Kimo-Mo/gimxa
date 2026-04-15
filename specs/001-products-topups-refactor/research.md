# Phase 0 Research: Products & Top-Up Management Refactor

**Feature**: `001-products-topups-refactor`
**Date**: 2026-04-15
**Status**: Complete — all unknowns resolved

---

## R-01 — React Query v5 Query Key Strategy

**Decision**: Use namespaced string-tuple keys with a centralized `adminQueryKeys` registry:

```ts
['admin', 'products', params]   // list: scoped to page/search/filter combo
['admin', 'product',  slug]     // detail: scoped to slug
['admin', 'topups',   params]   // list
['admin', 'topup',    slug]     // detail
['admin', 'packages', slug]     // package list per topup
['admin', 'categories']         // reference data — no params
['admin', 'tags']               // reference data — invalidated on create/delete
```

**Rationale**: Tuple keys enable partial invalidation — `queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })` invalidates every product list query regardless of which `params` object was used. This is the idiomatic React Query v5 pattern and prevents stale-after-mutation bugs.

**Alternatives considered**: Flat string keys (`'adminProducts'`) — rejected because they cannot be partially matched for bulk invalidation of parameterised variants.

---

## R-02 — `staleTime` Configuration Per Query

**Decision**:

| Query Key | `staleTime` | Reason |
|-----------|------------|--------|
| `['admin', 'categories']` | `Infinity` | Static admin-managed reference; rarely changes mid-session |
| `['admin', 'tags']` | `5 * 60 * 1000` (5 min) | Admins create tags on-the-fly; 5 min prevents redundant refetches |
| All list queries (products, topups) | `0` (default) | Needs fresh data on every navigation |
| All detail queries (product, topup, packages) | `0` (default) | Edited data must be current |

**Rule**: After any tag `create` or `delete` mutation, `queryClient.invalidateQueries({ queryKey: ['admin', 'tags'] })` is called immediately regardless of `staleTime`.

**Rationale**: Confirmed during clarification Q4. The two-tier approach avoids unnecessary network calls for stable data while ensuring tags remain consistent after mutations.

**Alternatives considered**: `staleTime: Infinity` for tags — rejected because a tag created in another browser tab would not appear within a session. 5 minutes is a pragmatic balance.

---

## R-03 — Shared Cache-Clear Hook Pattern

**Decision**: Create `src/hooks/admin/useCacheClear.ts` — a shared utility hook returning an async `cacheClear()` function:

```ts
// pattern (not implementation code)
cacheClear() = async () => {
  try { await authService.clearCache() }
  catch (err) { console.error('[cache-clear]', err) }
  // NEVER throws — does not block the subsequent invalidateQueries call
}
```

Every `useMutation` `onSuccess` callback:
1. Calls `await cacheClear()`
2. Then calls `queryClient.invalidateQueries({ queryKey: [...] })`

**Rationale**: The two-step pattern appears across all ~12 mutations in this phase. A shared hook eliminates copy-paste drift and centrally enforces the "silent fail, never block invalidation" rule from the spec edge case and PLAN.md Section 2.

**Alternatives considered**: Inline `try/catch` per mutation — rejected; 12 duplications increases miss-rate risk for the critical silent-fail behaviour.

---

## R-04 — `adminDeleteTag` Service Gap

**Decision**: Add the following to `src/services/catalog.service.ts`:

```ts
// signature only — implementation goes in tasks phase
adminDeleteTag: async (id: number): Promise<void>
  // DELETE /catalog/admin/tags/{id}/
  // Expected: 204 No Content
```

**Risk flag**: If `DELETE /catalog/admin/tags/{id}/` is not yet implemented on the Django backend, the FR-P11 implementation task is `BLOCKED`. The mutation `onError` handler must surface a toast: `"Tag deletion is not supported yet."` and gracefully not call `invalidateQueries`.

**Rationale**: FR-P11 (tag deletion from product forms) requires this endpoint. The route pattern is consistent with existing `catalogService` delete methods. No backend changes are assumed by this plan — only the frontend service wrapper is added.

**Alternatives considered**: Soft-delete (remove tag from `selectedTags` state only, not from the server) — rejected per FR-P11 which explicitly requires a server-side permanent delete.

---

## R-05 — Top-Up Create Page Scope

**Decision**: `topups/create/` page is **out of scope** for this phase.

**Evidence**: `src/app/(admin)/dashboard/topups/create/` directory exists but contains no `page.tsx`. Top-up creation is not yet built in the codebase.

**Scope boundary**: Phase 1 refactors only **existing** pages. New pages are deferred to a future phase.

**Alternatives considered**: Scaffolding a minimal create page — rejected to keep phase scope bounded and prevent task list bloat.

---

## R-06 — Products List `product_type` Exclusion Parameter

**Decision**: Pass `product_type: 'key'` exclusion — or use the `is_topup: false` boolean — as a server-side filter param to `adminProductsList`. Confirmed in clarification Q1.

**Implementation note**: The exact param name and value must be verified at implementation time by checking the backend's `AdminProductListView` filter fields. Two candidates from `CatalogSearchParams`:
- `product_type: string` — pass the non-topup type value (e.g. `'key'`, `'game'`, `'giftcard'`, `'software'`, `'console'`)
- `is_topup: false` — boolean exclusion flag

If neither is supported, fall back to client-side `Array.filter()` **after** confirming with the backend team (note: this degrades pagination accuracy — see Q1 rationale).

**Query key**: Must include the filter value to prevent cache collisions with the full unfiltered list used elsewhere:
```ts
['admin', 'products', { page, search, categoryId, product_type: '<non-topup-value>' }]
```

**Alternatives considered**: Client-side `.filter(p => p.product_type !== 'topup')` — rejected in Q1; causes inaccurate per-page counts.
