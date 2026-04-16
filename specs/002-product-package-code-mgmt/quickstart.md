# Quickstart: Product/Package Code Management

**Feature**: 002-product-package-code-mgmt  
**Date**: 2026-04-16

This guide orients an implementer to all the files they will touch, the patterns they must follow, and what the finished feature looks like.

---

## What This Phase Builds

1. **Product edit page (`/dashboard/products/[slug]/edit`)**: For products with `stock_mode = "automatic"`, the existing simple bulk-add textarea (`ProductCodes.tsx`) is replaced with a full code inventory section (`ProductCodeInventory.tsx`) that shows a live table of all codes, a `total_codes` / `available_codes` summary, and a bulk-add textarea below.

2. **Top-up edit page Packages tab (`/dashboard/topups/[slug]`)**: Each package card with `stock_mode = "automatic"` gains an inline `available_codes` count badge and a collapsible/inline bulk-add textarea. Each package fires its own independent query.

---

## Key Constraints (non-negotiable)

| Rule | Detail |
|------|--------|
| React Query only | `useQuery` for fetches, `useMutation` for writes — no `useEffect` data fetching |
| Cache-clear hook | Every `onSuccess`: `await authService.clearCache()` → `queryClient.invalidateQueries(...)` |
| No `any` | All types explicit; use `AdminCodeListResponse`, `AdminCode`, `AdminCodeUpdatePayload` |
| Error + loading states | Every `useQuery` and `useMutation` renders skeleton/spinner on load, toast/message on error |
| Confirmation dialogs | Invalidate and Delete require a dialog before mutation fires |

---

## File-by-File Guide

### Step 1 — Patch Types (do this first)

**File**: `src/types/admin/codes.ts`

Add `AdminCodeListResponse`:
```ts
export interface AdminCodeListResponse {
  total_codes: number;
  available_codes: number;
  codes: AdminCode[];
}
```

Extend `AdminCodeUpdatePayload`:
```ts
export interface AdminCodeUpdatePayload {
  assigned?: boolean;
  code?: string;
  is_used?: boolean;   // ← add this
}
```

---

### Step 2 — New Hooks

**`src/hooks/admin/useProductCodesQuery.ts`**
```ts
// useQuery(['admin', 'codes', slug]) → AdminCodeListResponse
// calls codeService.adminCodeListForProduct(slug)
```

**`src/hooks/admin/usePackageCodesQuery.ts`**
```ts
// useQuery(['admin', 'codes', slug, packageId]) → AdminCodeListResponse
// calls codeService.adminCodeListForProductPackage(slug, { package_id: String(packageId) })
```

**`src/hooks/admin/useCodeMutations.ts`** — three exports:
- `useAddProductCodesMutation(slug)` — calls `codeService.adminAddUpdateDeleteCodes(slug, { codes: codeString })`; invalidates `['admin', 'codes', slug]`
- `useInvalidateCodeMutation(slug)` — calls `codeService.adminUpdateSingleCode(slug, id, { is_used: true, code: editedCode })`; invalidates `['admin', 'codes', slug]`
- `useDeleteCodeMutation(slug)` — calls `codeService.adminDeleteSingleCode(slug, id)`; invalidates `['admin', 'codes', slug]`

**`src/hooks/admin/usePackageCodeMutations.ts`**
- `useAddPackageCodesMutation(slug, packageId)` — calls `codeService.adminAddUpdateDeleteCodes(slug, { codes: codeString, package_id: String(packageId) })`; invalidates `['admin', 'codes', slug, packageId]`

---

### Step 3 — New Product Components

**`ProductCodeInventory.tsx`** — top-level container. Only renders when `stockMode === 'automatic'`. Uses `useProductCodesQuery`. Shows:
1. `<CodeSummaryHeader total={} available={} />`
2. Loading skeleton or `<CodeInventoryTable codes={} />`
3. Error state with retry button
4. Empty state when `codes.length === 0`
5. `<BulkAddCodesForm slug={} />`

**`CodeInventoryTable.tsx`** — renders a Shadcn `<Table>` with columns: `#ID`, `Code` (monospace), `Status` (badge), `Actions` (Invalidate + Delete buttons). Used/available codes have distinct badge styles. Invalidate button hidden when `is_used === true`.

**`CodeSummaryHeader.tsx`** — shows "X total / Y available" above the table.

**`BulkAddCodesForm.tsx`** — textarea (monospace font, 6 rows), "Add Codes" button. On submit: strips blank lines from textarea value, validates non-empty, calls `useAddProductCodesMutation`. Retains input on mutation error.

**`InvalidateCodeDialog.tsx`** — opens for the targeted `AdminCode`. Contains:
- Description text: "This will mark the code as used…"
- Editable text input pre-filled with `code.code` value
- Confirm + Cancel buttons
- On confirm: calls `useInvalidateCodeMutation` with `{ is_used: true, code: editedValue }`
- Stays open on error (shows toast); closes on success

**`DeleteCodeDialog.tsx`** — permanent deletion warning. Confirm fires `useDeleteCodeMutation`. Closes on success or cancel.

---

### Step 4 — New Top-Up Package Components

**`PackageCodeSection.tsx`** — used inside `PackagesTab` for each automatic-mode package. Props: `slug: string`, `packageId: number`. Uses `usePackageCodesQuery(slug, packageId)`. Shows:
- Loading: inline spinner next to label
- Error: shows "—" with a retry link
- Success: shows `available_codes` count as a badge
- Always renders `<BulkAddPackageCodesForm>`

**`BulkAddPackageCodesForm.tsx`** — same structure as `BulkAddCodesForm` but scoped to the package. Uses `useAddPackageCodesMutation(slug, packageId)`.

---

### Step 5 — Wire Into Host Pages

**`src/app/(admin)/dashboard/products/[slug]/edit/page.tsx`**

Replace the existing `<ProductCodes ... isEditMode />` block (lines 447–458) with:
```tsx
{stockMode === 'automatic' && <ProductCodeInventory slug={slug} />}
```
No other changes to the page.

**`src/app/(admin)/dashboard/topups/[slug]/page.tsx`**  
Inside `PackagesTab`, after each package's existing form fields, conditionally render:
```tsx
{pkg.id && pkg.stock_mode === 'automatic' && (
  <PackageCodeSection slug={slug} packageId={pkg.id} />
)}
```
Note: Only render for packages with a persisted `pkg.id` (not newly added unsaved packages).

---

## Acceptance Test Checklist

Use these to smoke-test each story:

- [x] US1: Open edit page of an automatic product → Codes tab shows live list with summary header, bulk-add works, list refreshes, new codes appear without manual reload.
- [x] US2: Open Packages tab of a top-up → each automatic package shows `available_codes` count; bulk-add increases the count on success.
- [x] US3: Click Invalidate on an unused code → dialog opens with editable input → confirm → code row flips to "Used" badge → button is now hidden/disabled for that code.
- [x] US4: Click Delete on a code → permanent dialog → confirm → code disappears from list.
- [x] Manual stock mode: Products with `stock_mode = "manual"` show no code inventory section. Packages with `stock_mode = "manual"` show no code count or bulk-add.
- [x] Error states: Kill network, observe skeleton → error message with retry option (no crash).
- [x] TypeScript: `tsc --noEmit` from project root — zero errors.
