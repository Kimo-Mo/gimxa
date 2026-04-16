# Data Model: Product/Package Code Management

**Feature**: 002-product-package-code-mgmt  
**Date**: 2026-04-16  
**Source**: spec.md + research.md + `src/types/admin/codes.ts`

---

## Entities

### AdminCode *(exists — extend)*

Located at: `src/types/admin/codes.ts`

```ts
export interface AdminCode {
  id: number;
  code: string;          // the fulfillment code string value
  assigned: boolean;     // already in codebase
  is_used: boolean;      // true = consumed/invalidated; false = available
  package_id?: number | null;   // present for top-up package codes
  product_slug?: string;
  created_at?: string;
}
```

**No changes needed** to `AdminCode` — it already has `is_used`.

---

### AdminCodeListResponse *(new — add to `src/types/admin/codes.ts`)*

The API response envelope returned by `adminCodeListForProduct` and `adminCodeListForProductPackage`.

```ts
export interface AdminCodeListResponse {
  total_codes: number;      // integer — all codes regardless of is_used status
  available_codes: number;  // integer — count of codes where is_used = false
  codes: AdminCode[];       // unpaginated array of all Code objects
}
```

**Impact**: `codeService.adminCodeListForProduct` and `codeService.adminCodeListForProductPackage` must have their return types updated from implicit `any` to `Promise<AdminCodeListResponse>`.

---

### AdminCodeUpdatePayload *(extend — add `is_used`)*

Located at: `src/types/admin/codes.ts`

```ts
// CURRENT
export interface AdminCodeUpdatePayload {
  assigned?: boolean;
  code?: string;
}

// AFTER (add is_used)
export interface AdminCodeUpdatePayload {
  assigned?: boolean;
  code?: string;
  is_used?: boolean;  // added: required for invalidation action
}
```

---

### AdminCodePayload *(no change needed)*

Located at: `src/types/admin/codes.ts` (and mirrored in `src/types/code.ts`).

```ts
export interface AdminCodePayload {
  code?: string;
  codes?: string;             // newline-delimited bulk string for bulk-add
  package_id?: string | number;
}
```

---

## State Transitions

```
Code lifecycle:
  AVAILABLE (is_used = false)
    │
    ├─ [invalidate action] → USED (is_used = true) — irreversible via UI
    │                         │
    │                         └─ [delete action] → DELETED (removed from DB)
    │
    └─ [delete action] → DELETED (removed from DB)

  New codes:
    [bulk-add action] → AVAILABLE (is_used = false, newly created)
```

---

## Query Key Conventions (React Query)

| Query / Mutation | Key |
|---|---|
| Product code list | `['admin', 'codes', slug]` |
| Package code list | `['admin', 'codes', slug, packageId]` |
| Bulk-add product codes | invalidates `['admin', 'codes', slug]` |
| Bulk-add package codes | invalidates `['admin', 'codes', slug, packageId]` |
| Invalidate/edit single code | invalidates `['admin', 'codes', slug]` |
| Delete single code | invalidates `['admin', 'codes', slug]` |

---

## New Component File Map

### Product Codes (new, under `src/components/admin/products/`)

| File | Responsibility |
|------|----------------|
| `ProductCodeInventory.tsx` | Host container — fetches via `useQuery`, renders summary header + `CodeInventoryTable` + `BulkAddCodesForm`. Replaces the existing `ProductCodes.tsx` role. |
| `CodeInventoryTable.tsx` | Table displaying all `AdminCode[]` rows. Shows `code`, `is_used` badge, invalidate + delete action buttons. Only shown when `stock_mode === 'automatic'`. |
| `CodeSummaryHeader.tsx` | Displays `total_codes` and `available_codes` from `AdminCodeListResponse`. |
| `BulkAddCodesForm.tsx` | Textarea + "Add Codes" button. Validates non-empty, strips blank lines. Fires `useAddProductCodesMutation`. |
| `InvalidateCodeDialog.tsx` | Confirmation dialog with editable code input. Fires `useInvalidateCodeMutation`. Pre-fills with current `code` value. |
| `DeleteCodeDialog.tsx` | Confirmation dialog (permanent deletion warning). Fires `useDeleteCodeMutation`. |

### Package Code Count (augment `PackagesTab.tsx` in `src/components/admin/topups/`)

| File | Responsibility |
|------|----------------|
| `PackageCodeSection.tsx` | Renders the `available_codes` count + `BulkAddPackageCodesForm` for a single automatic-mode package. Fires its own `useQuery` keyed by `[slug, packageId]`. Isolated — failures do not affect sibling packages. |
| `BulkAddPackageCodesForm.tsx` | Inline textarea + "Add Codes" button scoped to one package. Fires `useAddPackageCodesMutation(slug, packageId)`. |

### Hooks (new, under `src/hooks/admin/`)

| File | Hook(s) |
|------|---------|
| `useProductCodesQuery.ts` | `useProductCodesQuery(slug)` — `useQuery` returning `AdminCodeListResponse` |
| `usePackageCodesQuery.ts` | `usePackageCodesQuery(slug, packageId)` — `useQuery` returning `AdminCodeListResponse`, keyed per package |
| `useCodeMutations.ts` | `useAddProductCodesMutation(slug)`, `useInvalidateCodeMutation(slug)`, `useDeleteCodeMutation(slug)` |
| `usePackageCodeMutations.ts` | `useAddPackageCodesMutation(slug, packageId)` |
