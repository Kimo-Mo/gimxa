# Tasks: Product/Package Code Management

**Input**: Design documents from `specs/002-product-package-code-mgmt/`  
**Branch**: `002-product-package-code-mgmt`  
**Spec**: `specs/002-product-package-code-mgmt/spec.md`  
**Plan**: `specs/002-product-package-code-mgmt/plan.md`  
**Data Model**: `specs/002-product-package-code-mgmt/data-model.md`

---

## ⚠️ Pre-Implementation: Read These First

Before touching any file, read:
1. `specs/002-product-package-code-mgmt/quickstart.md` — exact implementation guide per file
2. `specs/002-product-package-code-mgmt/data-model.md` — all types and query key conventions
3. `src/hooks/admin/useTopupMutations.ts` — the canonical pattern for `useMutation` + `useCacheClear` in this project

**Architecture rules (non-negotiable)**:
- ALL data fetching → `useQuery` only. No `useEffect` + `useState` for server data.
- ALL writes → `useMutation` only.
- Every `onSuccess` → `await cacheClear()` THEN `queryClient.invalidateQueries(...)`.
- No `any` types. No inline `style` props. Tailwind CSS 4 only.
- Use `useCacheClear` from `src/hooks/admin/useCacheClear.ts` — already used project-wide.

---

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to

---

## Phase 1: Setup — Type Definitions

**Purpose**: Fix two type gaps that unblock ALL other tasks. Must be completed first.

---

- [x] T001 Extend `AdminCodeUpdatePayload` in `src/types/admin/codes.ts` — add `is_used?: boolean` field.

  Current file content:
  ```ts
  export interface AdminCodeUpdatePayload {
    assigned?: boolean;
    code?: string;
  }
  ```
  Change to:
  ```ts
  export interface AdminCodeUpdatePayload {
    assigned?: boolean;
    code?: string;
    is_used?: boolean; // required for the invalidation mutation payload
  }
  ```

- [x] T002 Add `AdminCodeListResponse` interface to `src/types/admin/codes.ts` (after the existing interfaces).

  Add this new interface:
  ```ts
  export interface AdminCodeListResponse {
    total_codes: number;     // total count of all codes regardless of is_used status
    available_codes: number; // count of codes where is_used = false
    codes: AdminCode[];      // unpaginated array of all code objects for this product/package
  }
  ```

**Checkpoint**: Run `npx tsc --noEmit` — must pass with zero new errors before continuing.

---

## Phase 2: Foundational — React Query Hooks

**Purpose**: All query and mutation hooks used by the UI components. Must be complete before Phase 3+.  
**Pattern to follow**: Look at `src/hooks/admin/useTopupMutations.ts` for the exact `useMutation` + `useCacheClear` pattern.

---

- [x] T003 [P] Create `src/hooks/admin/useProductCodesQuery.ts` — `useQuery` hook that fetches the full code list for a product.

  Full file content:
  ```ts
  import { useQuery } from '@tanstack/react-query';
  import { codeService } from '@/services/code.service';
  import type { AdminCodeListResponse } from '@/types/admin/codes';

  export const useProductCodesQuery = (slug: string) => {
    return useQuery<AdminCodeListResponse>({
      queryKey: ['admin', 'codes', slug],
      queryFn: () => codeService.adminCodeListForProduct(slug) as Promise<AdminCodeListResponse>,
      enabled: !!slug,
    });
  };
  ```

- [x] T004 [P] Create `src/hooks/admin/usePackageCodesQuery.ts` — `useQuery` hook that fetches the code list for a single top-up package.

  Full file content:
  ```ts
  import { useQuery } from '@tanstack/react-query';
  import { codeService } from '@/services/code.service';
  import type { AdminCodeListResponse } from '@/types/admin/codes';

  export const usePackageCodesQuery = (slug: string, packageId: number) => {
    return useQuery<AdminCodeListResponse>({
      queryKey: ['admin', 'codes', slug, packageId],
      queryFn: () =>
        codeService.adminCodeListForProductPackage(slug, {
          package_id: String(packageId),
        }) as Promise<AdminCodeListResponse>,
      enabled: !!slug && !!packageId,
      refetchOnWindowFocus: false,
    });
  };
  ```

- [x] T005 Create `src/hooks/admin/useCodeMutations.ts` — three mutations for product-level code actions.

  Full file content:
  ```ts
  import { useMutation, useQueryClient } from '@tanstack/react-query';
  import { codeService } from '@/services/code.service';
  import { useCacheClear } from './useCacheClear';
  import { toast } from 'sonner';
  import type { AdminCodeUpdatePayload } from '@/types/admin/codes';

  // Bulk-add codes for a product (no package_id)
  export const useAddProductCodesMutation = (slug: string) => {
    const queryClient = useQueryClient();
    const cacheClear = useCacheClear();

    return useMutation({
      mutationFn: (codesText: string) => {
        // codesText is a newline-delimited string; strip blank lines before sending
        const cleaned = codesText
          .split('\n')
          .map((c) => c.trim())
          .filter(Boolean)
          .join('\n');
        return codeService.adminAddUpdateDeleteCodes(slug, { codes: cleaned });
      },
      onSuccess: async () => {
        await cacheClear();
        queryClient.invalidateQueries({ queryKey: ['admin', 'codes', slug] });
        toast.success('Codes added successfully.');
      },
      onError: () => {
        toast.error('Failed to add codes.');
      },
    });
  };

  // Mark a single code as used (invalidate). Also allows editing the code string simultaneously.
  export const useInvalidateCodeMutation = (slug: string) => {
    const queryClient = useQueryClient();
    const cacheClear = useCacheClear();

    return useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: AdminCodeUpdatePayload }) =>
        codeService.adminUpdateSingleCode(slug, id, payload),
      onSuccess: async () => {
        await cacheClear();
        queryClient.invalidateQueries({ queryKey: ['admin', 'codes', slug] });
        toast.success('Code invalidated.');
      },
      onError: () => {
        toast.error('Failed to invalidate code.');
      },
    });
  };

  // Permanently delete a single code
  export const useDeleteCodeMutation = (slug: string) => {
    const queryClient = useQueryClient();
    const cacheClear = useCacheClear();

    return useMutation({
      mutationFn: (id: number) => codeService.adminDeleteSingleCode(slug, id),
      onSuccess: async () => {
        await cacheClear();
        queryClient.invalidateQueries({ queryKey: ['admin', 'codes', slug] });
        toast.success('Code deleted.');
      },
      onError: () => {
        toast.error('Failed to delete code.');
      },
    });
  };
  ```

- [x] T006 Create `src/hooks/admin/usePackageCodeMutations.ts` — mutation for bulk-adding codes to a specific top-up package.

  Full file content:
  ```ts
  import { useMutation, useQueryClient } from '@tanstack/react-query';
  import { codeService } from '@/services/code.service';
  import { useCacheClear } from './useCacheClear';
  import { toast } from 'sonner';

  // Bulk-add codes for a specific top-up package
  export const useAddPackageCodesMutation = (slug: string, packageId: number) => {
    const queryClient = useQueryClient();
    const cacheClear = useCacheClear();

    return useMutation({
      mutationFn: (codesText: string) => {
        const cleaned = codesText
          .split('\n')
          .map((c) => c.trim())
          .filter(Boolean)
          .join('\n');
        return codeService.adminAddUpdateDeleteCodes(slug, {
          codes: cleaned,
          package_id: String(packageId),
        });
      },
      onSuccess: async () => {
        await cacheClear();
        queryClient.invalidateQueries({ queryKey: ['admin', 'codes', slug, packageId] });
        toast.success('Codes added to package.');
      },
      onError: () => {
        toast.error('Failed to add codes to package.');
      },
    });
  };
  ```

**Checkpoint**: Run `npx tsc --noEmit` — zero errors. All four hook files must compile cleanly.

---

## Phase 3: User Story 1 — Product Code Inventory (Priority: P1) 🎯 MVP

**Goal**: Replace the existing plain textarea `<ProductCodes>` block in the product edit page with a full live code inventory: summary header (`total_codes` / `available_codes`), scrollable code table with invalidate + delete actions, and a bulk-add textarea at the bottom.

**Independent Test**: Open the edit page for any product with `stock_mode = "automatic"` at `/dashboard/products/[slug]/edit`. The Codes section should show a live list of existing codes with their status badges, both counts in the header, and a working bulk-add textarea. Products with `stock_mode = "manual"` must NOT show the Codes section at all.

---

### Implementation for User Story 1

- [x] T007 [P] [US1] Create `src/components/admin/products/CodeSummaryHeader.tsx` — displays `total_codes` and `available_codes` counts above the code table.

  Full component:
  ```tsx
  interface CodeSummaryHeaderProps {
    totalCodes: number;
    availableCodes: number;
  }

  export function CodeSummaryHeader({ totalCodes, availableCodes }: CodeSummaryHeaderProps) {
    return (
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          <span className="font-semibold text-foreground">{totalCodes}</span> total
        </span>
        <span>·</span>
        <span>
          <span className="font-semibold text-success">{availableCodes}</span> available
        </span>
        <span>·</span>
        <span>
          <span className="font-semibold text-destructive">{totalCodes - availableCodes}</span> used
        </span>
      </div>
    );
  }
  ```

- [x] T008 [P] [US1] Create `src/components/admin/products/InvalidateCodeDialog.tsx` — confirmation dialog for invalidating (marking as used) a single code. Also allows editing the code string.

  Rules:
  - Accept `code: AdminCode | null` prop (null = dialog closed)
  - Accept `onClose: () => void` and `onConfirm: (editedCode: string) => void` and `isPending: boolean`
  - When `code` is not null, render a Shadcn `<Dialog>` that is `open`
  - Inside the dialog: description text "This will permanently mark the code as used. You can optionally correct the code string before confirming.", an editable `<Input>` pre-filled with `code.code`, and "Confirm" + "Cancel" buttons
  - "Confirm" is disabled while `isPending`; shows a spinner `<Loader2>` from `lucide-react` while pending
  - On "Confirm" click: call `onConfirm(editedValue.trim())`; the parent handles mutation
  - On "Cancel" or dialog close: call `onClose()`
  - The dialog does NOT close automatically on confirm — the parent closes it via `onClose` after `onSuccess`

  Import types from `@/types/admin/codes`.  
  Use Shadcn: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter` from `@/components/ui/dialog`. `Button` from `@/components/ui/button`. `Input` from `@/components/ui/input`.

- [x] T009 [P] [US1] Create `src/components/admin/products/DeleteCodeDialog.tsx` — confirmation dialog for permanently deleting a single code.

  Rules:
  - Accept `code: AdminCode | null` (null = closed), `onClose: () => void`, `onConfirm: () => void`, `isPending: boolean`
  - Render a Shadcn `<Dialog>` open when `code !== null`
  - Warning text: "This action is permanent and cannot be undone. The code will be removed from the system."
  - Show the targeted code value in monospace font inside the dialog for context
  - "Delete" button (variant `destructive`), disabled while `isPending`, shows spinner
  - "Cancel" button closes dialog via `onClose()`
  - Dialog does NOT auto-close on confirm — parent calls `onClose()` on `onSuccess`

  Use same Shadcn imports as T008. Import `AdminCode` from `@/types/admin/codes`.

- [x] T010 [P] [US1] Create `src/components/admin/products/BulkAddCodesForm.tsx` — textarea + submit for adding new codes to a product.

  Rules:
  - Accept `slug: string` as prop
  - Internal state: `codesText: string` (controlled textarea)
  - Uses `useAddProductCodesMutation(slug)` from `src/hooks/admin/useCodeMutations`
  - On submit: validate `codesText.trim()` is non-empty; if empty show inline error message "Please enter at least one code." — no API call
  - On submit (valid): strip blank lines (`.split('\n').map(c => c.trim()).filter(Boolean).join('\n')`), call `mutation.mutate(cleanedText)`, clear textarea ONLY on success (in `onSuccess` callback of `mutation.mutate(...)`)
  - On error: retain textarea content; do not clear it
  - Textarea: 6 rows, monospace font (`font-mono`), placeholder `"CODE-AAAA-1111\nCODE-BBBB-2222\nCODE-CCCC-3333"`, `resize-none`
  - Show live count below textarea: `"{n} code(s) entered"` where n = filtered non-empty lines
  - Submit button: disabled while `mutation.isPending`, shows `<Loader2>` spinner while pending

  Imports: `useAddProductCodesMutation` from `@/hooks/admin/useCodeMutations`, `Button` from `@/components/ui/button`, `Textarea` from `@/components/ui/textarea`, `Label` from `@/components/ui/label`, `Loader2` from `lucide-react`.

- [x] T011 [US1] Create `src/components/admin/products/CodeInventoryTable.tsx` — table displaying all codes with status badges and action buttons.

  Rules:
  - Props: `codes: AdminCode[]`, `slug: string`
  - Internally manages two pieces of state: `invalidateTarget: AdminCode | null` and `deleteTarget: AdminCode | null`
  - Uses `useInvalidateCodeMutation(slug)` and `useDeleteCodeMutation(slug)` from `src/hooks/admin/useCodeMutations`
  - Renders a Shadcn `<Table>` with columns: `#` (id), `Code` (monospace), `Status` (badge), `Actions`
  - Status badge: if `code.is_used === true` → red badge labelled "Used"; if false → green badge labelled "Available"
    - Badge CSS: Used → `className="bg-destructive/20 text-destructive border-none font-medium"`
    - Badge CSS: Available → `className="bg-success/20 text-success border-none font-medium"`
  - Actions column has two icon buttons:
    - "Invalidate" button (`<Key>` icon from lucide-react, size icon, ghost variant): HIDDEN (do not render) when `code.is_used === true`; on click sets `invalidateTarget = code`
    - "Delete" button (`<Trash2>` icon, destructive color, ghost variant): always visible; on click sets `deleteTarget = code`
  - Renders `<InvalidateCodeDialog>` with `code={invalidateTarget}`, `onClose={() => setInvalidateTarget(null)}`, `isPending={invalidateMutation.isPending}`, and `onConfirm` handler:
    ```ts
    onConfirm={(editedCode) => {
      if (!invalidateTarget) return;
      invalidateMutation.mutate(
        { id: invalidateTarget.id, payload: { is_used: true, code: editedCode } },
        { onSuccess: () => setInvalidateTarget(null) }
      );
    }}
    ```
  - Renders `<DeleteCodeDialog>` with `code={deleteTarget}`, `onClose={() => setDeleteTarget(null)}`, `isPending={deleteMutation.isPending}`, and `onConfirm` handler:
    ```ts
    onConfirm={() => {
      if (!deleteTarget) return;
      deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
    }}
    ```

  Imports: `AdminCode` from `@/types/admin/codes`, `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow` from `@/components/ui/table`, `Badge` from `@/components/ui/badge`, `Button` from `@/components/ui/button`, `Key`, `Trash2` from `lucide-react`. Import the two dialog components from the same folder.

- [x] T012 [US1] Create `src/components/admin/products/ProductCodeInventory.tsx` — the top-level host container for the product code inventory section.

  Rules:
  - Props: `slug: string`
  - Uses `useProductCodesQuery(slug)` from `src/hooks/admin/useProductCodesQuery`
  - Wrapped in a Shadcn `<Card>` with `<CardHeader>` title "Code Inventory" and `<CardContent>`
  - States to handle:
    - `isPending`: render a `<Skeleton>` block (use multiple `<Skeleton className="h-4 w-full" />` lines inside the card)
    - `isError`: render an error message `"Failed to load codes."` with a `<Button variant="outline" onClick={() => refetch()}>Retry</Button>`
    - `data.codes.length === 0`: render empty state — `"No codes yet. Add some below."` in muted text; the `<BulkAddCodesForm>` must still be visible below
    - Success with codes: render `<CodeSummaryHeader>` then `<CodeInventoryTable>` then `<BulkAddCodesForm>`
  - Structure:
    ```tsx
    <Card>
      <CardHeader>
        <CardTitle>Code Inventory</CardTitle>
        {data && <CodeSummaryHeader totalCodes={data.total_codes} availableCodes={data.available_codes} />}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* loading / error / empty / table */}
        <BulkAddCodesForm slug={slug} />
      </CardContent>
    </Card>
    ```
  - Add `'use client'` directive at the top (this is a Client Component).

  Imports: `useProductCodesQuery` from `@/hooks/admin/useProductCodesQuery`, `CodeSummaryHeader`, `CodeInventoryTable`, `BulkAddCodesForm` from same folder, `Skeleton` from `@/components/ui/skeleton`, `Card`, `CardContent`, `CardHeader`, `CardTitle` from `@/components/ui/card`, `Button` from `@/components/ui/button`.

- [x] T013 [US1] Wire `<ProductCodeInventory>` into `src/app/(admin)/dashboard/products/[slug]/edit/page.tsx`.

  Find the block at approximately lines 447–458 that reads:
  ```tsx
  {stockMode === 'automatic' && (
    <ProductCodes
      codesText={codesText}
      setCodesText={(val) => {
        setCodesText(val);
        markDirty();
      }}
      errors={errors}
      clearError={clearError}
      isEditMode
    />
  )}
  ```
  Replace it with:
  ```tsx
  {stockMode === 'automatic' && <ProductCodeInventory slug={slug} />}
  ```

  Also update the import at the top of the file:
  - Remove: `import { ProductCodes } from '@/components/admin/products/ProductCodes';`
  - Add: `import { ProductCodeInventory } from '@/components/admin/products/ProductCodeInventory';`

  Also remove the `codesText` and `setCodesText` state declarations (lines ~52) since they are no longer used, and remove the `codesText` code-array block inside `handleSubmit` (lines ~308–316). The product codes are now managed as a separate mutation, NOT submitted with the main product form.

  > **Note**: Do not remove the `clearError` and `errors` state — they are still used by other fields.

**Checkpoint**: Navigate to `/dashboard/products/[slug]/edit` for an automatic-mode product. You should see the full code inventory table with count header and bulk-add textarea. Verify the `stock_mode = "manual"` product does NOT show the section. Run `npx tsc --noEmit`.

---

## Phase 4: User Story 2 — Package Code Inventory (Priority: P1)

**Goal**: Show an `available_codes` count badge and inline bulk-add textarea for each automatic-mode package in the Top-Up Packages tab.

**Independent Test**: Open `/dashboard/topups/[slug]` → Packages tab. For each automatic-mode package, a count badge showing available codes should appear. Pasting codes into a package's inline textarea and clicking "Add Codes" increases that package's count. A manual-mode package shows nothing extra.

---

### Implementation for User Story 2

- [x] T014 [P] [US2] Create `src/components/admin/topups/BulkAddPackageCodesForm.tsx` — inline textarea + submit scoped to a single top-up package.

  Rules:
  - Props: `slug: string`, `packageId: number`
  - Uses `useAddPackageCodesMutation(slug, packageId)` from `src/hooks/admin/usePackageCodeMutations`
  - Internal state: `codesText: string`
  - On submit: same validation as T010 (non-empty, strip blank lines), clear textarea only on success, retain on error
  - Textarea: 4 rows, monospace, `resize-none`, same placeholder as T010
  - Show live count below: `"{n} code(s)"` (compact for inline use)
  - Submit button: smaller size (`size="sm"`), disabled while pending, shows spinner

  Imports: `useAddPackageCodesMutation` from `@/hooks/admin/usePackageCodeMutations`, `Button`, `Loader2`, `Textarea`, `Label`.

- [x] T015 [US2] Create `src/components/admin/topups/PackageCodeSection.tsx` — renders the `available_codes` count + `BulkAddPackageCodesForm` for a single automatic-mode top-up package.

  Rules:
  - Props: `slug: string`, `packageId: number`
  - Uses `usePackageCodesQuery(slug, packageId)` from `src/hooks/admin/usePackageCodesQuery`
  - Add `'use client'` directive at top
  - Render inside a `<div className="space-y-2 border-t border-border pt-3 mt-2">`
  - Header row: label "Code Inventory" with the count badge inline:
    - `isPending`: show `<Loader2 className="h-3 w-3 animate-spin" />` spinner next to the label
    - `isError`: show `"—"` in muted text with a small text link "Retry" that calls `refetch()`
    - Success: show `<Badge>{data.available_codes} available</Badge>` (use green/success variant)
  - Below the header: always render `<BulkAddPackageCodesForm slug={slug} packageId={packageId} />`
  - A failure in this component MUST NOT propagate — wrap the entire render in a try/catch or use the query's `isError` state gracefully; no thrown exceptions.

  Imports: `usePackageCodesQuery` from `@/hooks/admin/usePackageCodesQuery`, `BulkAddPackageCodesForm` from same folder, `Badge` from `@/components/ui/badge`, `Loader2` from `lucide-react`.

- [x] T016 [US2] Augment `src/components/admin/topups/PackagesTab.tsx` — add `<PackageCodeSection>` inside each automatic-mode package card.

  Find the block inside the packages map that handles `pkg.stock_mode === 'automatic'` (currently renders the inline textarea for codes, around lines 178–204). This is the textarea used during **package creation** (new packages) — **keep it as-is for unsaved packages** (`!pkg.id`).

  After the existing codes textarea block, add the following **immediately before the closing `</div>` of each package card** (the outer div that wraps the entire package form):
  ```tsx
  {pkg.id && pkg.stock_mode === 'automatic' && (
    <PackageCodeSection slug={slug} packageId={pkg.id} />
  )}
  ```

  This means: if the package is already saved (has an `id`) and is automatic mode, show the live code count section. New (unsaved) packages still use the existing inline textarea for initial codes.

  Also add `slug: string` to `PackagesTabProps` interface at the top of the file, and pass it through from wherever `PackagesTab` is called.

  Import `PackageCodeSection` from `'./PackageCodeSection'`.

- [x] T017 [US2] Pass `slug` prop to `<PackagesTab>` in `src/app/(admin)/dashboard/topups/[slug]/page.tsx`.

  Find where `<PackagesTab>` is rendered. Add `slug={slug}` prop. The `slug` variable is already available in this page component from `useParams()`.

**Checkpoint**: Open Packages tab for a top-up. Each saved automatic-mode package should show the code count section. Manual-mode packages show nothing extra. Adding codes via the inline form should update the count without full-page reload. Run `npx tsc --noEmit`.

---

## Phase 5: User Story 3 — Invalidate a Single Code (Priority: P2)

**Goal**: The "Invalidate" action on a code row in the product code table opens a dialog where the admin can optionally edit the code string and then marks it as used. The dialog is already created in T008 and wired in T011. This phase verifies the full flow works end-to-end.

**Independent Test**: Open the Codes tab for a product with at least one available code. Click the key icon next to an available code. A dialog appears with the code string pre-filled in an editable input. Change the code string slightly and confirm. The code row refreshes to show the "Used" badge and the updated code string. The key icon disappears from that row.

---

### Implementation for User Story 3

- [x] T018 [US3] Verify `InvalidateCodeDialog.tsx` (created in T008) correctly initializes the input value from `code.code` each time the dialog opens for a different code.

  In `InvalidateCodeDialog.tsx`, the editable input value must reset when `code` prop changes. Add a `useEffect`:
  ```ts
  useEffect(() => {
    if (code) setEditedValue(code.code);
  }, [code]);
  ```
  Ensure the `editedValue` local state is initialized to `''` and only populated when `code` is non-null.

- [x] T019 [US3] Verify that `CodeInventoryTable.tsx` (created in T011) hides the Invalidate button for codes where `is_used === true`.

  Confirm the "Invalidate" (`<Key>`) button is conditionally rendered:
  ```tsx
  {!code.is_used && (
    <Button variant="ghost" size="icon" onClick={() => setInvalidateTarget(code)}>
      <Key className="h-4 w-4" />
    </Button>
  )}
  ```
  If the button is currently rendered unconditionally, fix it now.

**Checkpoint**: Smoke-test the full invalidation flow manually using the test described above.

---

## Phase 6: User Story 4 — Delete a Single Code (Priority: P2)

**Goal**: The "Delete" action on any code row opens a permanent-deletion warning dialog. Confirming calls `adminDeleteSingleCode` and removes the code from the list.

**Independent Test**: Open the Codes tab for a product. Click the trash icon on any code (used or unused). A dialog appears warning the action is permanent and showing the code value. Confirm. The code row disappears. The `total_codes` count in the header decreases by 1.

---

### Implementation for User Story 6

- [x] T020 [US4] Verify `DeleteCodeDialog.tsx` (created in T009) shows the targeted code's value in the dialog body for confirmation context.

  In `DeleteCodeDialog.tsx`, ensure the dialog body includes a `<code>` block that displays `code.code` (the code string) in monospace so the admin can confirm they are deleting the right one:
  ```tsx
  <p className="text-sm text-muted-foreground">
    Code: <span className="font-mono text-foreground">{code.code}</span>
  </p>
  ```
  If this is already present, no action needed.

- [x] T021 [US4] Verify `CodeInventoryTable.tsx` (T011) passes `deleteTarget` to `<DeleteCodeDialog>` and calls `deleteMutation.mutate` on confirm — confirm end-to-end delete flow is wired.

  Check that:
  1. The delete button sets `deleteTarget = code`
  2. `<DeleteCodeDialog code={deleteTarget} ...>` is rendered
  3. `onConfirm` calls `deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })`
  4. After deletion the query invalidates and the code disappears from the refreshed list

**Checkpoint**: Smoke-test the full deletion flow manually using the test described above.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T022 [P] Verify all empty states are present and correct:
  - Product code table with zero codes: `"No codes yet. Add some below."` visible; `<BulkAddCodesForm>` still rendered and usable.
  - Package code section when fetch fails: shows `"—"` with a Retry link, does not crash.

- [x] T023 [P] Verify all loading states:
  - `ProductCodeInventory` shows `<Skeleton>` blocks while `isPending`
  - `PackageCodeSection` shows an inline spinner while `isPending`

- [x] T024 [P] Verify responsive layout: on mobile (< 640px), the code table should be horizontally scrollable (wrap in `<div className="overflow-x-auto">`). Check `CodeInventoryTable.tsx`.

- [x] T025 Run the full TypeScript check: `npx tsc --noEmit` from project root `c:\iProjects\gimxa`. Zero errors required. Fix any type errors before marking complete.

- [x] T026 Manual smoke test using every scenario in `specs/002-product-package-code-mgmt/quickstart.md` acceptance checklist. Mark each checkbox in the quickstart.md file as you verify it.

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Types)
  └── Phase 2 (Hooks) — depends on Phase 1 types
        └── Phase 3 (US1 — Product Codes) — depends on Phase 2 hooks
        └── Phase 4 (US2 — Package Codes) — depends on Phase 2 hooks
              └── Phase 5 (US3 — Invalidate) — depends on Phase 3 (T008, T011)
              └── Phase 6 (US4 — Delete) — depends on Phase 3 (T009, T011)
                    └── Phase 7 (Polish) — depends on all stories
```

### Parallel Opportunities

Within **Phase 2**: T003 and T004 can run in parallel (different files).

Within **Phase 3**: T007, T008, T009, T010 can all run in parallel (different files). T011 depends on T008+T009. T012 depends on T011.

Within **Phase 4**: T014 and T015 can run together after T006.

### Story Independence

| Story | Blocks | Depends On |
|-------|--------|------------|
| US1 (Product Codes) | US3, US4 | Phase 2 hooks |
| US2 (Package Codes) | — | Phase 2 hooks |
| US3 (Invalidate) | — | US1 components (T008, T011) |
| US4 (Delete) | — | US1 components (T009, T011) |

---

## Parallel Example

```
# Phase 2 — run T003 and T004 at the same time (different files):
T003: useProductCodesQuery.ts
T004: usePackageCodesQuery.ts

# Phase 3 — run first four tasks at the same time:
T007: CodeSummaryHeader.tsx
T008: InvalidateCodeDialog.tsx
T009: DeleteCodeDialog.tsx
T010: BulkAddCodesForm.tsx
# Then T011 (depends on T008 + T009), then T012 (depends on T011), then T013 (depends on T012)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (T001–T002)
2. Complete Phase 2 (T003–T006)
3. Complete Phase 3 (T007–T013)
4. **STOP and VALIDATE**: Smoke-test per US1 independent test criteria
5. Continue to Phase 4+ once US1 is verified

### Incremental Delivery

1. Phase 1 + Phase 2 → types + hooks ready
2. Phase 3 → Full product code inventory live (US1 MVP)
3. Phase 4 → Package code counts live (US2)
4. Phase 5 + Phase 6 → Invalidation and deletion wired (US3, US4)
5. Phase 7 → Polish, TypeScript gate, smoke tests

---

## Notes

- The `useCacheClear` hook is imported from `src/hooks/admin/useCacheClear.ts` — this already exists project-wide; do not recreate it.
- The `codeService` at `src/services/code.service.ts` already has all required methods — do not modify it.
- The `api` Axios instance is used internally by `codeService` — do not call `api` directly in hooks or components.
- `success` is a Tailwind CSS color token defined in this project (used for available badge). If it causes a build error, use `green-500` as fallback.
- Commit after each completed phase checkpoint.
