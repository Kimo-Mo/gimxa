# Research: Product/Package Code Management

**Feature**: 002-product-package-code-mgmt  
**Date**: 2026-04-16  
**Status**: Complete — no NEEDS CLARIFICATION items remain

---

## Decision Log

### D-01: Code List Rendering Strategy — Unpaginated Full-List

- **Decision**: Render ALL codes for a product/package via a single `useQuery` call without pagination parameters. Only `available_codes` and `total_codes` (both integers from the response) are used for the summary header.
- **Rationale**: The spec explicitly states no pagination on either product-level or package-level code lists. The existing `CodesTable` component in `src/components/admin/codes/` already renders a flat list and can be adapted directly.
- **Alternatives considered**: Paginated fetch with page/page_size (was considered by user, then corrected as wrong).

### D-02: Host Surface — Augment Existing Pages, No New Routes

- **Decision**: The codes UI is embedded directly into the existing product edit page (`/dashboard/products/[slug]/edit`) and the existing top-up packages tab (`/dashboard/topups/[slug]`). No new routes or pages are created by this phase.
- **Rationale**: The spec defines Phase 2 as augmenting Phase 1 host surfaces. The product edit page already renders `<ProductCodes>` (a bulk-add textarea only). This phase replaces it with a full inventory view + bulk-add.
- **Alternatives considered**: Separate `/dashboard/products/[slug]/codes` route — rejected as it requires navigation away from the edit flow.

### D-03: Invalidation Dialog — Combined Edit + Invalidate in One useMutation

- **Decision**: The invalidation dialog renders an editable input pre-filled with the current code value. Payload sent to `codeService.adminUpdateSingleCode(slug, id, { is_used: true, code: editedCode })` always includes both fields. The dialog stays open on mutation error so the admin can retry.
- **Rationale**: The user clarified this is the intended UX — an admin may correct a code string and mark it used simultaneously. The `AdminCodeUpdatePayload` type in `src/types/admin/codes.ts` already has `code?: string` but is missing `is_used`. The type MUST be extended.
- **Alternatives considered**: Separate "Edit Code" and "Invalidate Code" actions — rejected by user (Option A chosen in clarification session).

### D-04: Type Gap — `AdminCodeUpdatePayload` Missing `is_used`

- **Decision**: Extend `AdminCodeUpdatePayload` in `src/types/admin/codes.ts` to add `is_used?: boolean`. This is required for the invalidation mutation payload.
- **Rationale**: Existing type only has `assigned?: boolean` and `code?: string`. The invalidation action sends `{ is_used: true, code: editedCode }`. Without this field, the payload is incorrectly typed.
- **Alternatives considered**: Use `as AdminCodeUpdatePayload` cast — rejected (violates Constitution Principle II: no `any` or unsafe casts).

### D-05: Type Gap — `AdminCodeListResponse` Missing

- **Decision**: Create a new `AdminCodeListResponse` interface in `src/types/admin/codes.ts` with `total_codes: number`, `available_codes: number`, and `codes: AdminCode[]`. This type is used as the return type of both `adminCodeListForProduct` and `adminCodeListForProductPackage`.
- **Rationale**: The spec defines a clear response shape. Without this type, the codeService return values are untyped (`any`), violating Constitution Principle II.
- **Alternatives considered**: Inline types per query — rejected (not DRY, harder to maintain).

### D-06: Reuse vs. New Components for Code Table in Product Edit

- **Decision**: Create NEW focused components under `src/components/admin/products/codes/` rather than re-using `src/components/admin/codes/CodesTable.tsx`. The existing components in `src/components/admin/codes/` are wired to the legacy standalone codes page which uses a different data flow (manual `useState`/`useEffect`).
- **Rationale**: The legacy codes page components pass `loading`, `error`, `selectedProduct` props from manual state. The new components will receive typed React Query data directly. Mixing the two wiring patterns would create ambiguity. New components stay focused.
- **Alternatives considered**: Adapting `CodesTable` to accept React Query data — possible but increases the component's prop surface and couples it to two different host patterns.

### D-07: Package Code Count — `useQuery` Per Package, No Shared Query

- **Decision**: Each automatic-mode package in the Packages tab fires its own independent `useQuery` for `adminCodeListForProductPackage(slug, { package_id })`. The query key is `['admin', 'codes', slug, packageId]`. A failure for one package MUST NOT cascade.
- **Rationale**: Packages are independent entities with separate code pools. Independent queries with `refetchOnWindowFocus: false` allow granular invalidation after bulk-add.
- **Alternatives considered**: Single query fetching all packages' codes — rejected (would require server-side aggregation not confirmed by the spec, and would cascade loading/error states across packages).

### D-08: Cache-Clear + Invalidation Query Keys

The following query keys are used in this phase:

| Mutation | Query Keys Invalidated |
|----------|------------------------|
| Bulk-add codes (product) | `['admin', 'codes', slug]` |
| Invalidate single code | `['admin', 'codes', slug]` |
| Delete single code | `['admin', 'codes', slug]` |
| Bulk-add codes (package) | `['admin', 'codes', slug, packageId]` |

All of the above call `authService.clearCache()` first, then `queryClient.invalidateQueries`.

---

## Existing Asset Inventory

| Asset | Path | Reuse Plan |
|-------|------|------------|
| `AdminCode` type | `src/types/admin/codes.ts` | Reuse, extend with `is_used` on update type |
| `AdminCodeUpdatePayload` | `src/types/admin/codes.ts` | Extend: add `is_used?: boolean` |
| `codeService.adminCodeListForProduct` | `src/services/code.service.ts` | Reuse as-is |
| `codeService.adminCodeListForProductPackage` | `src/services/code.service.ts` | Reuse as-is |
| `codeService.adminUpdateSingleCode` | `src/services/code.service.ts` | Reuse as-is |
| `codeService.adminDeleteSingleCode` | `src/services/code.service.ts` | Reuse as-is |
| `codeService.adminAddUpdateDeleteCodes` | `src/services/code.service.ts` | Reuse as-is |
| `ProductCodes.tsx` (bulk-add textarea only) | `src/components/admin/products/` | Replace with new full-inventory component |
| `PackagesTab.tsx` (existing codes textarea) | `src/components/admin/topups/` | Augment with `available_codes` count + independent per-package query |
| `CodesTable`, `EditCodeDialog`, `DeleteCodeDialog` | `src/components/admin/codes/` | Do NOT reuse — legacy manual data flow |
| `useCacheClear` hook | Existing (Phase 1) | Reuse directly |
