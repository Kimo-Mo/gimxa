# Tasks: Products & Top-Up Management Refactor

**Feature**: `001-products-topups-refactor`
**Date**: 2026-04-15
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Model**: [data-model.md](./data-model.md) | **Contracts**: [contracts/api-contracts.md](./contracts/api-contracts.md)

---

## Instructions for Implementing LLM

Read these rules before executing any task:

1. **Never output code in chat.** Write directly to files. Summarise in ≤3 sentences.
2. **No `any` type.** Use `unknown` + narrowing if the shape is unclear.
3. **Cache-clear hook pattern** — every `useMutation` `onSuccess` MUST:
   ```
   await cacheClear();
   queryClient.invalidateQueries({ queryKey: [...] });
   ```
4. **staleTime rules**: categories → `Infinity`; tags → `5 * 60 * 1000`; everything else → omit (default 0).
5. **Do not redesign any UI.** Only the data-wiring changes. Keep all JSX identical unless the task explicitly says otherwise.
6. Mark each task `[x]` when done.
7. Execute tasks in order. Do not skip ahead.

---

## Phase 1 — Setup: Shared Infrastructure

> Must complete before any user story tasks begin.

- [ ] T001 Create directory `src/hooks/admin/` (create a `.gitkeep` file inside if no files yet exist there)

- [ ] T002 Create file `src/hooks/admin/queryKeys.ts` with the following exact content:
  ```ts
  import type { CatalogSearchParams } from '@/types';
  import type { AdminTopupListParams } from '@/types/admin/topups';

  export const adminQueryKeys = {
    products:   (params: CatalogSearchParams)   => ['admin', 'products', params] as const,
    product:    (slug: string)                  => ['admin', 'product',  slug]   as const,
    topups:     (params: AdminTopupListParams)  => ['admin', 'topups',   params] as const,
    topup:      (slug: string)                  => ['admin', 'topup',    slug]   as const,
    packages:   (slug: string)                  => ['admin', 'packages', slug]   as const,
    categories: ()                              => ['admin', 'categories']        as const,
    tags:       ()                              => ['admin', 'tags']              as const,
  } as const;
  ```

- [ ] T003 Create file `src/hooks/admin/useCacheClear.ts`. This hook returns an async `cacheClear()` function that calls `authService.clearCache()` and silently catches any error (logs to console, does NOT re-throw). Import `authService` from `@/services/auth.service`. The function signature must be `() => Promise<void>`.

- [ ] T004 Add method `adminDeleteTag` to `src/services/catalog.service.ts`. Add it after `adminAddTag`. Signature: `adminDeleteTag: async (id: number): Promise<void>`. Implementation: `await api.delete(\`/catalog/admin/tags/${id}/\`)` — do NOT return data (204 No Content). Wrap in try/catch is NOT needed — let the caller handle errors.

---

## Phase 2 — Foundational: Shared Query Hooks

> These hooks are used by multiple user stories. Complete before Phase 3.

- [ ] T005 [P] Create file `src/hooks/admin/useCategoriesQuery.ts`. Use `useQuery` from `@tanstack/react-query`. Import `adminQueryKeys` from `./queryKeys` and `catalogService` from `@/services/catalog.service`. Import `ProductCategory` from `@/types/catalog`.
  - Query key: `adminQueryKeys.categories()`
  - Query fn: `catalogService.adminCategoriesList()`
  - `staleTime: Infinity`
  - Return the full query result so callers can access `data`, `isLoading`, `isError`.
  - Do NOT filter the results inside this hook — callers do their own filtering.

- [ ] T006 [P] Create file `src/hooks/admin/useTagsQuery.ts`. Use `useQuery`. Import `adminQueryKeys` and `catalogService`. Import `ProductTag` from `@/types/catalog`.
  - Query key: `adminQueryKeys.tags()`
  - Query fn: `catalogService.adminTagsList()`
  - `staleTime: 5 * 60 * 1000`
  - Type the return as `ProductTag[]` — extract from the query response (handle both `data.results` array and plain array responses).
  - Return the full query object.

---

## Phase 3 — US1: Browse & Delete Products (P1)

**Story goal**: Admin can view a paginated, server-side filtered product list and delete a product.
**Independent test**: Navigate to `/dashboard/products`, search, change page, delete one product — confirm auto-refresh with no manual reload.

- [ ] T007 [US1] Create file `src/hooks/admin/useProductsQuery.ts`.
  - Accept params object: `{ page: number; search: string; categoryId: string }`.
  - Build the query params: `{ page, page_size: 10, ...(search ? { search } : {}), ...(categoryId !== 'all' ? { category: categoryId } : {}), product_type: 'key' }`.
  - **NOTE on `product_type`**: Pass `product_type: 'key'` to exclude topups server-side. If this causes empty results during testing, remove it and add a client-side `.filter(p => p.product_type !== 'topup')` fallback — add a TODO comment explaining why.
  - Query key: `adminQueryKeys.products({ page, page_size: 10, search, category: categoryId, product_type: 'key' })`.
  - Query fn: `catalogService.adminProductsList(params)`.
  - `staleTime: 0` (omit — use default).
  - Return the full query object typed as `PaginatedResponse<Product>`.
  - Import `PaginatedResponse` from `@/types` and `Product` from `@/types/catalog`.

- [ ] T008 [US1] Create file `src/hooks/admin/useDeleteProductMutation.ts`.
  - Import `useMutation`, `useQueryClient` from `@tanstack/react-query`.
  - Import `catalogService`, `useCacheClear` from respective paths, `adminQueryKeys`, `toast` from `sonner`.
  - `mutationFn`: `(slug: string) => catalogService.adminDeleteProduct(slug)`.
  - `onSuccess`: call `await cacheClear()`, then `queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })`, then `toast.success('Product deleted successfully.')`.
  - `onError`: `toast.error('Failed to delete product.')`.
  - Return the mutation object.

- [ ] T009 [US1] Refactor `src/app/(admin)/dashboard/products/page.tsx`.
  - DELETE all `useState` declarations for: `products`, `pagination`, `loading`, `error`, `deleting`.
  - DELETE the `fetchProducts` `useCallback` and its `useEffect`.
  - DELETE the `handleDelete` async function.
  - KEEP: `useState` for `search`, `debouncedSearch`, `categoryId`, `page`, `deleteSlug` (these are UI-only state — allowed).
  - KEEP: the debounce `useEffect` for `search → debouncedSearch`.
  - KEEP: the `useEffect(() => setPage(1), [debouncedSearch, categoryId])`.
  - ADD at the top of the component: `const productsQuery = useProductsQuery({ page, search: debouncedSearch, categoryId })`.
  - ADD: `const deleteMutation = useDeleteProductMutation()`.
  - ADD: `const categoriesQuery = useCategoriesQuery()`.
  - Replace `categories` state with: `const categories = (categoriesQuery.data ?? []).filter(c => !c.name.startsWith('Topup'))`.
  - Replace all `products` references with `productsQuery.data?.results ?? []`.
  - Replace `loading` with `productsQuery.isPending`.
  - Replace `error` rendering with `productsQuery.isError ? <div ...>{error message}</div> : null`.
  - Replace `pagination.*` references: `productsQuery.data?.total_pages ?? 1`, `productsQuery.data?.current_page ?? 1`, `productsQuery.data?.count ?? 0`.
  - Replace `handleDelete` call in `DeleteProductDialog` with: `() => { deleteMutation.mutate(deleteSlug!); setDeleteSlug(null); }`.
  - Replace `deleting` prop with `deleteMutation.isPending`.
  - Add required imports: `useProductsQuery`, `useDeleteProductMutation`, `useCategoriesQuery`.
  - Remove unused imports: `useEffect` (keep only the two that remain), `useState` (keep for the 5 remaining state vars), `useCallback`, `authService`.

---

## Phase 4 — US4: Browse & Delete Top-Ups (P1)

**Story goal**: Admin can view a paginated top-up list and delete a top-up.
**Independent test**: Navigate to `/dashboard/topups`, search, delete one — confirm auto-refresh.

- [ ] T010 [P] [US4] Create file `src/hooks/admin/useTopupsQuery.ts`.
  - Accept params: `{ page: number; search: string }`.
  - Query key: `adminQueryKeys.topups({ page, page_size: 10, ...(search ? { search } : {}) })`.
  - Query fn: `topupService.adminTopupsList({ page, page_size: 10, ...(search ? { search } : {}) })`.
  - Import `topupService` from `@/services/topup.service`, `AdminTopupGame` from `@/types/admin/topups`, `PaginatedResponse` from `@/types`.
  - Return typed as `PaginatedResponse<AdminTopupGame>`.

- [ ] T011 [P] [US4] Create file `src/hooks/admin/useDeleteTopupMutation.ts`.
  - `mutationFn`: `(slug: string) => catalogService.adminDeleteProduct(slug)` — uses `catalogService`, NOT `topupService.adminDeleteTopup`. This is intentional (see research R-04).
  - `onSuccess`: `await cacheClear()` → `queryClient.invalidateQueries({ queryKey: ['admin', 'topups'] })` → `toast.success('Top-up deleted successfully.')`.
  - `onError`: `toast.error('Failed to delete top-up.')`.

- [ ] T012 [US4] Refactor `src/app/(admin)/dashboard/topups/page.tsx`.
  - DELETE all `useState` for: `topups`, `pagination`, `loading`, `error`, `deleting`.
  - DELETE `fetchTopups` `useCallback` and its `useEffect`.
  - DELETE `handleDelete`.
  - KEEP: `useState` for `search`, `debouncedSearch`, `categoryId`, `page`, `deleteSlug`.
  - KEEP: debounce `useEffect` and page-reset `useEffect`.
  - ADD: `const topupsQuery = useTopupsQuery({ page, search: debouncedSearch })`.
  - ADD: `const deleteMutation = useDeleteTopupMutation()`.
  - ADD: `const categoriesQuery = useCategoriesQuery()`.
  - Category filtering is client-side: `const categories = (categoriesQuery.data ?? []).filter(c => c.name.startsWith('Topup'))`.
  - Topup list with client-side category filter: `const topups = (topupsQuery.data?.results ?? []).filter(t => categoryId === 'all' || t?.product?.categories?.some(c => String(c?.id) === categoryId))`.
  - Replace `loading` with `topupsQuery.isPending`, `error` with `topupsQuery.isError`.
  - Replace `pagination.*` with `topupsQuery.data?.total_pages ?? 1`, etc.
  - Wire delete: `() => { deleteMutation.mutate(deleteSlug!); setDeleteSlug(null); }`.
  - Remove unused imports.

---

## Phase 5 — US2: Create a New Product (P2)

**Story goal**: Admin can fill and submit the Create Product form with full validation and cache-clear on success.
**Independent test**: Submit with missing required fields → see inline errors. Submit valid form → product appears in list.

- [ ] T013 [P] [US2] Create file `src/hooks/admin/useCreateProductMutation.ts`.
  - `mutationFn`: `(formData: FormData) => dashboardService.adminCreateProductFull(formData)`.
  - `onSuccess`: `await cacheClear()` → `queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })` → `toast.success('Product created successfully!')`.
  - `onError (err: unknown)`: Parse `err` as `{ response?: { data?: { errors?: Record<string, unknown>; message?: string } } }`. If `errors` object exists, build a field-error string from its entries (≤4 fields). `toast.error(fieldErrors || message || 'Failed to create product.')`.
  - Return the mutation object — caller must handle `router.push('/dashboard/products')` in its own `onSuccess` or after `mutate()` resolves.

- [ ] T014 [P] [US2] Create file `src/hooks/admin/useTagMutations.ts`.
  - Export two mutations from this file:
    1. `useCreateTagMutation()`: `mutationFn: (name: string) => catalogService.adminAddTag({ name })`. `onSuccess`: `queryClient.invalidateQueries({ queryKey: ['admin', 'tags'] })`. No toast needed — caller handles UI update.
    2. `useDeleteTagMutation()`: `mutationFn: (id: number) => catalogService.adminDeleteTag(id)`. `onSuccess`: `queryClient.invalidateQueries({ queryKey: ['admin', 'tags'] })`. `onError`: `toast.error('Failed to delete tag.')`.
  - No `cacheClear()` needed for tag mutations — tags are admin UI data, not catalog cache.

- [ ] T015 [US2] Update `src/components/admin/products/ProductTags.tsx` to support tag deletion.
  - Add a new optional prop: `onDeleteTag?: (id: number) => void`.
  - Add a new optional prop: `deletingTagId?: number | null` (to show a spinner on the tag being deleted).
  - In the rendered tag list, add a small delete button (e.g. `×` icon or `Trash2` from lucide-react) next to each tag that: (a) calls `onDeleteTag(tag.id)` when clicked, (b) is disabled and shows a spinner if `deletingTagId === tag.id`.
  - Add a confirmation: Wrap the delete click in `window.confirm(\`Delete tag "${tag.name}"? This will remove it globally.\`)` — only call `onDeleteTag` if the user confirms.
  - Do NOT remove the existing "add tag" functionality. Only add the delete button alongside existing UI.
  - Keep all existing props unchanged.

- [ ] T016 [US2] Refactor `src/app/(admin)/dashboard/products/create/page.tsx`.
  - DELETE all data-fetching: `useEffect` for categories/tags, `useEffect` for URL revocation (keep cleanup logic — move into a `useEffect` return that uses `imagesRef`).
  - DELETE `handleAddNewTag` direct implementation (replace with mutation).
  - KEEP all local form state: `name`, `price`, `stockMode`, `manualFulfillmentTime`, `shortDescription`, `description`, `isActive`, `isAvailable`, `isPopular`, `isFeatured`, `region`, `images`, `attributes`, `codesText`, `selectedCategory`, `selectedTags`, `newTagInput`, `errors`.
  - ADD near top: `const categoriesQuery = useCategoriesQuery()`, `const tagsQuery = useTagsQuery()`, `const createMutation = useCreateProductMutation()`, `const createTagMutation = useCreateTagMutation()`, `const deleteTagMutation = useDeleteTagMutation()`.
  - Replace `categories` state with: `categoriesQuery.data?.filter(c => !c.name.startsWith('Topup')) ?? []`.
  - Replace `tags` state with: `tagsQuery.data ?? []` (handle both array and paginated).
  - Replace `handleAddNewTag` with a new inline function that calls `createTagMutation.mutate(trimmed, { onSuccess: (newTag) => { setSelectedTags(prev => [...prev, newTag.id]); setNewTagInput(''); } })`. Keep the "existing tag" early-return logic.
  - Replace `addingTag` state with `createTagMutation.isPending`.
  - Replace `handleSubmit` form logic: build the `FormData` exactly as before (keep all the existing FormData construction code unchanged), then call `createMutation.mutate(formData, { onSuccess: () => { images.forEach(img => { if (img.file && img.url.startsWith('blob:')) URL.revokeObjectURL(img.url); }); router.push('/dashboard/products'); } })`.
  - Replace `submitting` state with `createMutation.isPending`.
  - Pass `onDeleteTag` and `deletingTagId` to `ProductTags`: `onDeleteTag={(id) => deleteTagMutation.mutate(id, { onSuccess: () => setSelectedTags(prev => prev.filter(t => t !== id)) })}` and `deletingTagId={deleteTagMutation.isPending ? deleteTagMutation.variables : null}`.
  - Remove all now-unused imports and state vars.

---

## Phase 6 — US3: Edit an Existing Product (P2)

**Story goal**: Admin edits a pre-filled product form and saves — list and detail update instantly.
**Independent test**: Change name + price, save → updated values on the list page. No page reload.

- [ ] T017 [P] [US3] Create file `src/hooks/admin/useProductDetailQuery.ts`.
  - Accept `slug: string`.
  - Query key: `adminQueryKeys.product(slug)`.
  - Query fn: `catalogService.adminGetProduct(slug)`.
  - `enabled: !!slug` — do not fetch if slug is empty.
  - Return typed as `Product` from `@/types/catalog`.

- [ ] T018 [P] [US3] Create file `src/hooks/admin/useUpdateProductMutation.ts`.
  - `mutationFn`: `({ slug, formData }: { slug: string; formData: FormData }) => dashboardService.adminUpdateProductFull(slug, formData)`.
  - `onSuccess (_, { slug })`: `await cacheClear()` → `queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })` → `queryClient.invalidateQueries({ queryKey: ['admin', 'product', slug] })` → `toast.success('Product updated successfully!')`.
  - `onError`: same error-parsing pattern as T013.

- [ ] T019 [US3] Refactor `src/app/(admin)/dashboard/products/[slug]/edit/page.tsx`.
  - DELETE both `useEffect` blocks that fetch categories/tags and product data.
  - DELETE `handleAddNewTag` direct implementation.
  - KEEP all local form state vars (unchanged).
  - ADD: `const categoriesQuery = useCategoriesQuery()`, `const tagsQuery = useTagsQuery()`, `const productQuery = useProductDetailQuery(slug)`, `const updateMutation = useUpdateProductMutation()`, `const createTagMutation = useCreateTagMutation()`, `const deleteTagMutation = useDeleteTagMutation()`.
  - Replace `allCategories` state with `categoriesQuery.data?.filter(c => !c.name.startsWith('Topup')) ?? []`.
  - Replace `allTags` state with `tagsQuery.data ?? []`.
  - Populate form fields from `productQuery.data` using a `useEffect([productQuery.data])` — when `productQuery.data` changes and is not undefined, call all the `set*` functions (setName, setPrice, etc.) exactly as the original `useEffect` did. This preserves the data-loading behavior but is driven by the query result.
  - Replace `initialLoading` with `productQuery.isPending`.
  - Replace `error` state: show error UI when `productQuery.isError`.
  - Replace `handleAddNewTag` with same pattern as T016.
  - Replace `addingTag` with `createTagMutation.isPending`.
  - Replace `handleSubmit` body: keep all FormData construction code exactly as-is, then call `updateMutation.mutate({ slug, formData })`.
  - Replace `submitting` with `updateMutation.isPending`.
  - Pass `onDeleteTag` and `deletingTagId` to `ProductTags` same as T016.
  - Remove unused imports and state vars.

---

## Phase 7 — US5: Edit a Top-Up Product (P3)

**Story goal**: Admin manages a top-up through three independent tabs — each tab saves independently with cache-clear.
**Independent test**: Update game name in Info tab, save → name updates without tab change or page reload.

- [ ] T020 [P] [US5] Create file `src/hooks/admin/useTopupDetailQuery.ts`.
  - Accept `slug: string`.
  - Use `useQueries` from `@tanstack/react-query` to run three queries in parallel:
    1. `adminQueryKeys.topup(slug)` → `topupService.adminTopupDetail(slug)`
    2. `adminQueryKeys.packages(slug)` → `topupService.adminPackagesList(slug)`
    3. `adminQueryKeys.categories()` → `catalogService.adminCategoriesList()` with `staleTime: Infinity`
  - All three: `enabled: !!slug`.
  - Return `{ topupQuery, packagesQuery, categoriesQuery }` so the page can access each individually.

- [ ] T021 [P] [US5] Create file `src/hooks/admin/useTopupMutations.ts`. Export the following mutations — each follows the same `cacheClear → invalidateQueries` pattern:

  **`useUpdateTopupGameInfoMutation(slug: string)`**
  - `mutationFn: (formData: FormData) =>` two sequential calls: `await dashboardService.adminUpdateProductFull(slug, formData)` then `await topupService.adminUpdateTopup(slug, { is_active: ... })`. **Note**: the caller must pass `is_active` separately. Design the `mutationFn` to accept `{ formData: FormData; isActive: boolean }`. Run `adminUpdateProductFull`, then `adminUpdateTopup(slug, { is_active: isActive })`.
  - `onSuccess`: `await cacheClear()` → `queryClient.invalidateQueries({ queryKey: ['admin', 'topup', slug] })` → `toast.success('Game info updated successfully.')`.
  - `onError`: `toast.error('Failed to update game info.')`.

  **`useSaveTopupFieldsMutation(slug: string)`**
  - `mutationFn: (fields: FieldForm[]) =>` iterate the fields array and for each field: if `field.id` exists → `topupService.adminUpdateField(field.id, payload)` + for each help → `adminUpdateFieldHelp` or `adminAddFieldHelp`; if no `field.id` → `topupService.adminAddField({ ...payload, key: autoKey, game: topupId })` where `autoKey` is title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/, ''). The `topupId` must be passed to the hook as a parameter alongside `slug`. Accept `{ slug, topupId }` as hook params.
  - `onSuccess`: `await cacheClear()` → `queryClient.invalidateQueries({ queryKey: ['admin', 'topup', slug] })` → `toast.success('Fields saved successfully.')`.
  - `onError`: `toast.error('Failed to save fields.')`.

  **`useSaveTopupPackagesMutation(slug: string)`**
  - `mutationFn: (packages: PackageForm[]) =>` iterate packages. For each: build `FormData` (name, amount, price, is_active, is_popular, order, stock_mode, manual_fulfillment_time, game=topupId). If `pkg.id` → `adminUpdatePackage(pkg.id, fd)`. Else → `adminAddPackage(fd)` and capture returned `id`. After all packages saved: if any new package has `stock_mode = 'automatic'` and non-empty `codes`, call `codeService.adminAddUpdateDeleteCodes(slug, { codes: pkg.codes, package_id: String(pkgId) })` for each.
  - `onSuccess`: `await cacheClear()` → `queryClient.invalidateQueries({ queryKey: ['admin', 'topup', slug] })` + `queryClient.invalidateQueries({ queryKey: ['admin', 'packages', slug] })` → `toast.success('Packages saved successfully.')`.
  - `onError`: `toast.error('Failed to save packages.')`.

  **`useDeleteTopupItemMutation(slug: string)`**
  - Accept `{ type: 'field' | 'package'; id: number }`.
  - `mutationFn`: if `type === 'field'` → `topupService.adminDeleteField(id)`; else → `topupService.adminDeletePackage(id)`.
  - `onSuccess (_, { type })`: `await cacheClear()` → invalidate `['admin', 'topup', slug]`; if type === 'package' also invalidate `['admin', 'packages', slug]` → `toast.success(\`${type === 'field' ? 'Field' : 'Package'} deleted.\`)`.
  - `onError (_, { type })`: `toast.error(\`Failed to delete ${type}.\`)`.

- [ ] T022 [US5] Refactor `src/app/(admin)/dashboard/topups/[slug]/page.tsx`.
  - DELETE all `useState` for: `topup`, `loading`, `error`.
  - DELETE the `loadData` function and its `useEffect`.
  - DELETE the categories `useEffect`.
  - DELETE `handleSaveGameInfo`, `handleSaveFields`, `handleSavePackages`, `confirmDeleteField` direct implementations.
  - KEEP all form state: `fields`, `packages`, `gameName`, `region`, `selectedCategory`, `shortDescription`, `imageFile`, `currentLogo`, `isActive`, `isAvailable`, `isFeatured`, `deleteTarget`, `fieldErrors`, `pkgErrors`, `gameInfoErrors`.
  - KEEP `addField`, `addPackage`, `updateField`, `updatePackage`, `removeFieldLocally`, `handleDeleteHelp` local helpers (they only mutate local state).
  - ADD: `const { topupQuery, packagesQuery, categoriesQuery } = useTopupDetailQuery(slug)`.
  - ADD: `const gameInfoMutation = useUpdateTopupGameInfoMutation(slug)`, etc. for each mutation from T021.
  - Populate local state from queries using `useEffect`:
    - `useEffect` on `[topupQuery.data]`: when `topupQuery.data` is defined, run all the `setGameName`, `setRegion`, `setFields` etc. calls from the original `loadData` function.
    - `useEffect` on `[packagesQuery.data]`: when `packagesQuery.data` is defined, run the `setPackages` call.
  - Replace `categories` state + its `useEffect` with: `(categoriesQuery.data ?? []).filter(c => c.name.startsWith('Topup'))`.
  - Replace `loading` with `topupQuery.isPending`.
  - Replace `error` with `topupQuery.isError`.
  - Replace `handleSaveGameInfo` call in `GameInfoTab` prop with: a new function `handleSaveGameInfo` that validates (`gameName`, `selectedCategory`), then calls `gameInfoMutation.mutate({ formData, isActive })` — build the FormData exactly as the original.
  - Replace `savingGameInfo` with `gameInfoMutation.isPending`.
  - Replace `handleSaveFields` call with: `fieldsMutation.mutate(fields)`.
  - Replace `savingFields` with `fieldsMutation.isPending`.
  - Replace `handleSavePackages` call with: `packagesMutation.mutate(packages)`. After `onSuccess` the query invalidation will re-fetch and trigger the `useEffect` to repopulate `packages` state.
  - Replace `savingPackages` prop with `packagesMutation.isPending`.
  - Replace `confirmDeleteField` in `DeleteConfirmDialog.onConfirm` with: `deleteItemMutation.mutate(deleteTarget!)` then `setDeleteTarget(null)`.
  - Replace `deleting` with `deleteItemMutation.isPending`.
  - Remove all now-unused imports.

---

## Phase 8 — Polish & Cross-Cutting

- [ ] T023 Run TypeScript compiler check from repo root: `npx tsc --noEmit`. Fix every error before marking this task done. Do not suppress errors with `// @ts-ignore` — fix the actual types.

- [ ] T024 Audit all `useMutation` `onSuccess` callbacks across all new hook files in `src/hooks/admin/`. Verify every one calls `await cacheClear()` before `queryClient.invalidateQueries`. Flag any that are missing as a comment `// TODO: add cacheClear` — then add it.

- [ ] T025 Verify `useDeleteTagMutation` in `src/hooks/admin/useTagMutations.ts` does NOT call `cacheClear()` (tag mutations don't affect the Django catalog cache — this is intentional per research R-03).

- [ ] T026 Open `src/app/(admin)/dashboard/products/page.tsx`, `create/page.tsx`, `[slug]/edit/page.tsx`, `topups/page.tsx`, and `topups/[slug]/page.tsx`. Confirm none contain any raw `useEffect` that calls a service method directly (i.e. no `useEffect(() => { catalogService.xxx() ... }, [...])`). Only `useState` and UI-only `useEffect`s (debounce, cleanup) are permitted.

- [ ] T027 Confirm `src/services/catalog.service.ts` has `adminDeleteTag` method (added in T004). If missing, add it now.

- [ ] T028 Confirm `ProductTags.tsx` renders a delete button per tag. If the button was not added in T015, add it now following the same spec: confirmation via `window.confirm`, `onDeleteTag(id)` callback, disabled state when `deletingTagId === tag.id`.

---

## Dependency Graph

```
T001 → T002 → T003 → T004
               ↓
T005, T006 (parallel, both need T003)
               ↓
Phase 3 (T007, T008, T009) — needs T005, T006
Phase 4 (T010, T011, T012) — needs T005, T006 (parallel with Phase 3)
               ↓
Phase 5 (T013–T016) — needs T005, T006, T014, T015
Phase 6 (T017–T019) — needs T005, T006, T014, T015 (parallel with Phase 5)
               ↓
Phase 7 (T020–T022) — needs T006 (categories)
               ↓
Phase 8 (T023–T028) — needs all above complete
```

## Parallel Execution Opportunities

| Run in parallel | Tasks |
|----------------|-------|
| Shared query hooks | T005, T006 |
| Products list + Topups list | T007+T008+T009 alongside T010+T011+T012 |
| Create Product + Edit Product infrastructure | T013+T014 alongside T017+T018 |
| Topup queries + Topup mutations | T020 alongside T021 |

## Implementation Strategy (MVP Order)

1. **MVP** (Phase 1 + Phase 2 + Phase 3 + Phase 4): Unblocking list pages — admins can browse and delete both product types with correct React Query behaviour. Verifiable immediately.
2. **Increment 2** (Phase 5 + Phase 6): Create and Edit product forms — most complex due to tag mutations.
3. **Increment 3** (Phase 7): Top-up edit — most complex multi-mutation surface, built last.
4. **Cleanup** (Phase 8): TypeScript gate + compliance audit.

## Task Summary

| Phase | Tasks | Story |
|-------|-------|-------|
| 1 — Setup | T001–T004 | — |
| 2 — Foundational | T005–T006 | — |
| 3 — Products List | T007–T009 | US1 (P1) |
| 4 — Topups List | T010–T012 | US4 (P1) |
| 5 — Create Product | T013–T016 | US2 (P2) |
| 6 — Edit Product | T017–T019 | US3 (P2) |
| 7 — Edit Top-Up | T020–T022 | US5 (P3) |
| 8 — Polish | T023–T028 | — |
| **Total** | **28 tasks** | — |
