# Tasks: Coupon Management (Phase 5)

**Input**: Design documents from `specs/005-coupon-management/`  
**Spec**: `specs/005-coupon-management/spec.md`  
**Plan**: `specs/005-coupon-management/plan.md`  
**Data Model**: `specs/005-coupon-management/data-model.md`  
**Contracts**: `specs/005-coupon-management/contracts/api-contracts.md`  
**Research**: `specs/005-coupon-management/research.md`  
**Quickstart**: `specs/005-coupon-management/quickstart.md`

**User Stories**: US1=View/Filter List, US2=Create Coupon, US3=Edit Coupon, US4=Toggle Status, US5=Usage History, US6=Delete Coupon, US7=Resource Scoping

---

## ⚠️ CRITICAL IMPLEMENTATION RULES (Read before any task)

These rules apply to EVERY task in this file without exception:

1. **NO `useEffect`/`useState` for data fetching** — Forbidden by constitution. All server data via `useQuery` / `useMutation` only.
2. **Cache-clear on EVERY mutation** — Every `useMutation.onSuccess` MUST call `await authService.clearCache()` FIRST, then `queryClient.invalidateQueries(...)`.
3. **Zero `any` types** — Use `unknown` and narrow explicitly. Import types from `@/types/admin/coupons`.
4. **Axios `api` instance only** — Import from `@/lib/api/axios`. No raw `fetch`.
5. **Tailwind only** — No inline `style` props.
6. **Shadcn/Radix UI primitives** — Use existing `Dialog`, `Button`, `Badge`, `Table`, `Input`, `Select`, `Tabs`, `Skeleton`, `AlertDialog`, `Toast` from `@/components/ui/`.
7. **Loading/error/empty states** — Every `useQuery` must handle `isPending` (Skeleton), `isError` (toast + message), and empty array states.
8. **React Hook Form + Zod** — All forms use `useForm<CouponFormValues>({ resolver: zodResolver(couponFormSchema) })`.
9. **File size limit** — Keep each component file to ~150 lines max. Break into sub-components when needed.
10. **Import from `@/types/admin/coupons`** — NOT from `@/types/coupon`. The admin types file is the canonical source.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create files/utilities that every later task depends on.

**⚠️ COMPLETE PHASE 1 FULLY BEFORE STARTING PHASE 2.**

- [X] T001 Add `adminDeleteCoupon` method to `src/services/coupon.service.ts` — append after `adminCouponUsages`: `adminDeleteCoupon: async (id: string | number) => { const { data } = await api.delete(\`/coupons/admin/coupon/${id}/\`); return data; },` — Also update the import at the top to use `AdminCouponPayload` and `AdminAddResourceToCouponPayload` from `@/types/admin/coupons` instead of `@/types` (the `src/types/admin/coupons.ts` file is now the canonical source with the confirmed schema).

- [X] T002 Create `src/lib/utils/coupon-status.ts` — Export a pure function `computeCouponStatus(coupon: AdminCoupon): CouponDisplayStatus`. Import `AdminCoupon` from `@/types/admin/coupons`. Define `export type CouponDisplayStatus = 'active' | 'upcoming' | 'expired' | 'inactive'`. Logic: const now = new Date(); const start = new Date(coupon.start_at); const end = new Date(coupon.end_at); if (end < now) return 'expired'; if (start > now) return 'upcoming'; if (coupon.is_active) return 'active'; return 'inactive';

- [X] T003 Create `src/components/features/coupons/coupon-schema.ts` — Export `couponFormSchema` (Zod object) and `CouponFormValues` (inferred type). Fields: `code` (string, min 1, max 50, regex `/^[A-Z0-9_-]+$/`, message "Uppercase alphanumeric only"), `scope` (z.enum(['global(order)', 'product', 'package', 'category'])), `discount_type` (z.enum(['percent', 'fixed'])), `discount_value` (z.number().positive()), `start_at` (z.string().min(1, 'Required')), `end_at` (z.string().min(1, 'Required')), `max_usage` (z.number().int().positive().optional()), `is_active` (z.boolean().default(true)). Add `.superRefine` for: (a) if discount_type='percent' AND discount_value > 100, add issue on `discount_value` "Max 100 for percentage discounts"; (b) if end_at <= start_at, add issue on `end_at` "End date must be after start date". Also export `SCOPE_OPTIONS = ['global(order)', 'product', 'package', 'category'] as const` and `DISCOUNT_TYPE_OPTIONS = ['percent', 'fixed'] as const`.

- [X] T004 Create `src/components/features/coupons/couponKeys.ts` — Export `couponKeys` object: `all: ['admin', 'coupons'] as const`, `detail: (id: number | string) => ['admin', 'coupons', id] as const`, `usages: (id: number | string) => ['admin', 'coupons', id, 'usages'] as const`. This is the React Query key registry used by every hook in this feature.

- [X] T005 [P] Create `src/components/features/coupons/` directory — create a placeholder `index.ts` that will be populated as components are built (or simply create the directory; some tasks will create files directly in it).

**Checkpoint**: T001–T004 must all be complete before any Phase 2 work begins. Verify TypeScript compiles with zero errors on these 4 files before continuing.

---

## Phase 2: Foundational (Blocking Components Used Everywhere)

**Purpose**: Shared display/layout components used by multiple user story phases. Complete before Phase 3.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T006 Create `src/components/features/coupons/CouponStatusBadge.tsx` — A pure display component. Props: `{ coupon: AdminCoupon }`. Import `computeCouponStatus` from `@/lib/utils/coupon-status` and `CouponDisplayStatus` from same file. Import `AdminCoupon` from `@/types/admin/coupons`. Import `Badge` from `@/components/ui/badge`. Map status to badge: `'active'` → `className="bg-success/20 text-success border-none font-medium"` text "Active"; `'upcoming'` → `className="bg-blue-500/20 text-blue-400 border-none font-medium"` text "Upcoming"; `'expired'` → `className="bg-destructive/20 text-destructive border-none font-medium"` text "Expired"; `'inactive'` → `className="bg-muted/60 text-muted-foreground border-none font-medium"` text "Inactive". Export as default.

- [X] T007 Create `src/components/features/coupons/CouponListFilters.tsx` — Props: `{ activeFilter: string; onFilterChange: (filter: string) => void }`. Render a tab/button-bar with options: "All", "Active", "Upcoming", "Expired". The selected filter receives a highlighted style (e.g., `bg-primary text-primary-foreground`), others get `variant="ghost"`. Use `Button` from `@/components/ui/button`. This is a fully client-side filter — no API calls. Export as default.

**Checkpoint**: T006 and T007 complete. These are used in Phase 3 (list page). Verify TypeScript on both files.

---

## Phase 3: User Story 1 — View & Filter Coupon List (Priority: P1) 🎯 MVP

**Goal**: Refactor the existing 390-line monolith `page.tsx` into a React Query-powered list page with status filter tabs, skeleton loading, and empty state.

**Independent Test**: Navigate to `/dashboard/coupons`. Verify: (a) skeleton appears briefly then table loads, (b) All/Active/Upcoming/Expired tabs filter the visible rows correctly, (c) status badges show correct color per coupon.

### Implementation for User Story 1

- [X] T008 [US1] Create `src/components/features/coupons/CouponTableRow.tsx` — Props: `{ coupon: AdminCoupon; onEdit: (coupon: AdminCoupon) => void; onDelete: (coupon: AdminCoupon) => void; onViewUsage: (coupon: AdminCoupon) => void; onToggle: (coupon: AdminCoupon) => void; isToggling: boolean }`. Import `AdminCoupon` from `@/types/admin/coupons`. Import `CouponStatusBadge` from `./CouponStatusBadge`. Import `Badge`, `Button` from `@/components/ui/`. Import `TableRow`, `TableCell` from `@/components/ui/table`. Import icons: `Pencil`, `Trash2`, `History`, `ToggleLeft`, `ToggleRight` from `lucide-react`. Render one `<TableRow>`: Cell 1: `coupon.code` in mono font. Cell 2: scope badge (capitalize, outline variant). Cell 3: discount display (e.g., "25%" or "$10.00" based on `discount_type`). Cell 4: `coupon.start_at` formatted as locale date string. Cell 5: `coupon.end_at` formatted as locale date string. Cell 6: `{coupon.used_count ?? 0} / {coupon.max_usage ?? '∞'}`. Cell 7: `<CouponStatusBadge coupon={coupon} />`. Cell 8 (actions): Edit button (Pencil icon, calls `onEdit`), Usage button (History icon, calls `onViewUsage`), Toggle button (ToggleLeft/ToggleRight icon based on `coupon.is_active`, disabled when `isToggling`, calls `onToggle`), Delete button (Trash2 icon, calls `onDelete`). Use `size="icon"` `variant="ghost"` for all action buttons.

- [X] T009 [US1] Create `src/components/features/coupons/CouponListTable.tsx` — Props: `{ coupons: AdminCoupon[]; isLoading: boolean; filter: string; onEdit: (c: AdminCoupon) => void; onDelete: (c: AdminCoupon) => void; onViewUsage: (c: AdminCoupon) => void; onToggle: (c: AdminCoupon) => void; togglingId: number | null }`. Import `AdminCoupon` from `@/types/admin/coupons`. Import `computeCouponStatus` from `@/lib/utils/coupon-status`. Import `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` from `@/components/ui/table`. Import `Skeleton` from `@/components/ui/skeleton`. Import `CouponTableRow` from `./CouponTableRow`. Import `Tag` from `lucide-react`. Logic: filter `coupons` array: if filter='all' show all; if filter='active' show where `computeCouponStatus(c) === 'active'`; if filter='upcoming' show where status==='upcoming'; if filter='expired' show where status==='expired'. If `isLoading`: render 5 skeleton rows (`<TableRow>` with `<TableCell>` containing `<Skeleton className="h-4 w-24" />`). If filtered array is empty and not loading: render an empty state row spanning all columns (Tag icon + "No coupons found." message). Otherwise render `<CouponTableRow>` for each filtered coupon. Table headers: Code, Scope, Discount, Start, End, Used/Max, Status, Actions. Export as default.

- [X] T010 [US1] Refactor `src/app/(admin)/dashboard/coupons/page.tsx` — **COMPLETELY REPLACE** the existing file contents (do not preserve any `useState`/`useEffect` data-fetching patterns from the old implementation). New implementation: `'use client'`. Import `useState` from 'react' (only for UI state: `filter`, `selectedCoupon` for dialogs). Import `useQuery`, `useMutation`, `useQueryClient` from `@tanstack/react-query`. Import `couponService` from `@/services/coupon.service`. Import `authService` from `@/services/auth.service`. Import `couponKeys` from `@/components/features/coupons/couponKeys`. Import `AdminCoupon` from `@/types/admin/coupons`. Import `CouponListFilters` from `@/components/features/coupons/CouponListFilters`. Import `CouponListTable` from `@/components/features/coupons/CouponListTable`. Import `Button` from `@/components/ui/button`. Import `Plus` from `lucide-react`. Import `toast` from `sonner`. State: `filter: string = 'all'`, `createOpen: boolean = false`, `editCoupon: AdminCoupon | null = null`, `deleteCoupon: AdminCoupon | null = null`, `usageCoupon: AdminCoupon | null = null`, `togglingId: number | null = null`. Query: `useQuery({ queryKey: couponKeys.all, queryFn: () => couponService.adminCouponsList() })` — normalize response as `Array.isArray(data) ? data : (data?.results ?? [])` typed as `AdminCoupon[]`. Toggle mutation: `useMutation({ mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) => couponService.adminUpdateCoupon(id, { ...foundCoupon, is_active }), onMutate: ({ id }) => setTogglingId(id), onSuccess: async () => { await authService.clearCache(); queryClient.invalidateQueries({ queryKey: couponKeys.all }); setTogglingId(null); toast.success('Status updated'); }, onError: () => { setTogglingId(null); toast.error('Failed to update status'); } })`. Render: page header with title "Coupon Management" + "Create Coupon" button (Plus icon, onClick → setCreateOpen(true)). Then `<CouponListFilters activeFilter={filter} onFilterChange={setFilter} />`. Then `<CouponListTable coupons={coupons} isLoading={isPending} filter={filter} onEdit={setEditCoupon} onDelete={setDeleteCoupon} onViewUsage={setUsageCoupon} onToggle={(c) => toggleMutation.mutate({ id: c.id, is_active: !c.is_active })} togglingId={togglingId} />`. Placeholder `{createOpen && <div>Create dialog coming in US2</div>}`, `{editCoupon && <div>Edit dialog coming in US3</div>}`, `{deleteCoupon && <div>Delete dialog coming in US6</div>}`, `{usageCoupon && <div>Usage modal coming in US5</div>}` (these will be replaced by real components in their respective phases). Export as default function `AdminCouponsPage`.

**Checkpoint (US1)**: Navigate to `/dashboard/coupons`. Table should load with React Query (see network tab). Skeleton appears during fetch. Filter tabs show/hide rows based on status. Toggle button updates `is_active` and refreshes the list. No `useEffect` data-fetching remains. TypeScript compiles with zero errors.

---

## Phase 4: User Story 2 — Create a New Coupon (Priority: P1)

**Goal**: Dialog form for creating a new coupon with full Zod validation. On success, list auto-refreshes.

**Independent Test**: Click "Create Coupon". Submit with: (a) empty code → inline error; (b) percent > 100 → inline error on discount_value; (c) end_at before start_at → inline error on end_at; (d) all valid → coupon appears in list, dialog closes, success toast shown.

### Implementation for User Story 2

- [X] T011 [US2] Create `src/components/features/coupons/CouponCreateDialog.tsx` — Props: `{ open: boolean; onOpenChange: (open: boolean) => void }`. Import `useForm` from `react-hook-form`, `zodResolver` from `@hookform/resolvers/zod`. Import `couponFormSchema`, `CouponFormValues`, `SCOPE_OPTIONS`, `DISCOUNT_TYPE_OPTIONS` from `./coupon-schema`. Import `useMutation`, `useQueryClient` from `@tanstack/react-query`. Import `couponService` from `@/services/coupon.service`. Import `authService` from `@/services/auth.service`. Import `couponKeys` from `./couponKeys`. Import `toast` from `sonner`. Import `AdminCouponPayload` from `@/types/admin/coupons`. Import Shadcn: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription` from `@/components/ui/dialog`; `Button` from `@/components/ui/button`; `Input` from `@/components/ui/input`; `Label` from `@/components/ui/label`; `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` from `@/components/ui/select`. Form setup: `useForm<CouponFormValues>({ resolver: zodResolver(couponFormSchema), defaultValues: { code: '', scope: 'global(order)', discount_type: 'percent', discount_value: 0, start_at: '', end_at: '', is_active: true } })`. Mutation: `useMutation({ mutationFn: (payload: AdminCouponPayload) => couponService.adminAddCoupon(payload), onSuccess: async () => { await authService.clearCache(); queryClient.invalidateQueries({ queryKey: couponKeys.all }); toast.success('Coupon created successfully'); onOpenChange(false); reset(); }, onError: () => toast.error('Failed to create coupon') })`. `handleSubmit`: transforms `start_at`/`end_at` from datetime-local string to ISO string, then calls `mutation.mutate(payload)`. Form fields (all with `<Label>`, `<Input>`/`<Select>`, and `{errors.field && <p className="text-destructive text-xs">{errors.field.message}</p>}`): (1) Code — Input with `onChange` forced to `.toUpperCase()`, disabled if `mutation.isPending`; (2) Scope — Select with SCOPE_OPTIONS; (3) Discount Type — Select with DISCOUNT_TYPE_OPTIONS; (4) Discount Value — type="number" Input; (5) Start Date — `type="datetime-local"` Input; (6) End Date — `type="datetime-local"` Input; (7) Max Usage — type="number" Input (optional, placeholder "Unlimited"); (8) Active — checkbox input with Label. Footer: Cancel Button + Submit Button (disabled + shows "Creating…" when `mutation.isPending`). Export as default.

- [X] T012 [US2] Update `src/app/(admin)/dashboard/coupons/page.tsx` — Replace the placeholder `{createOpen && <div>Create dialog coming in US2</div>}` with `{createOpen && <CouponCreateDialog open={createOpen} onOpenChange={setCreateOpen} />}`. Add import: `import CouponCreateDialog from '@/components/features/coupons/CouponCreateDialog';` at the top of the file.

**Checkpoint (US2)**: Open Create dialog. Submit with invalid data — see inline Zod errors on the correct fields. Submit with valid data — coupon appears in list, dialog closes, success toast fires. Network tab shows `POST /coupons/admin/all/` then `GET /coupons/admin/all/` (re-fetch triggered by invalidation).

---

## Phase 5: User Story 3 — Edit an Existing Coupon (Priority: P2)

**Goal**: Dedicated edit page at `/dashboard/coupons/[id]/edit` with tabbed layout: Details tab (pre-populated form), Scoping tab (added in US7), Usage tab (added in US5).

**Independent Test**: Click edit on any row. Edit page loads with all fields pre-populated. Change `discount_value` and `end_at`. Click Save. Browser navigates back to list or shows success. Row in list reflects new values.

### Implementation for User Story 3

- [X] T013 [US3] Create `src/components/features/coupons/CouponEditForm.tsx` — Props: `{ coupon: AdminCoupon }`. This renders ONLY the Details tab content (form fields). Import same form/validation deps as T011. Import `useMutation`, `useQueryClient` from `@tanstack/react-query`. Import `couponKeys`, `couponService`, `authService`. Import `toast`. Import `AdminCouponPayload` from `@/types/admin/coupons`. Form default values: pre-populate from `coupon` prop — `code: coupon.code`, `scope: coupon.scope`, `discount_type: coupon.discount_type`, `discount_value: coupon.discount_value`, `start_at: coupon.start_at.slice(0, 16)` (trim to datetime-local format), `end_at: coupon.end_at.slice(0, 16)`, `max_usage: coupon.max_usage`, `is_active: coupon.is_active`. **Code field MUST be `disabled`** (read-only after creation). Reset form when `coupon` prop changes (use `useEffect` with `reset(defaultValues)` — NOTE: this is an allowed use of `useEffect` since it's for form reset, NOT for data fetching). Mutation: `useMutation({ mutationFn: (payload: AdminCouponPayload) => couponService.adminUpdateCoupon(coupon.id, payload), onSuccess: async () => { await authService.clearCache(); queryClient.invalidateQueries({ queryKey: couponKeys.all }); queryClient.invalidateQueries({ queryKey: couponKeys.detail(coupon.id) }); toast.success('Coupon updated'); }, onError: () => toast.error('Failed to update coupon') })`. Render same fields layout as CouponCreateDialog but `code` is a disabled Input. Save button at bottom: disabled + "Saving…" when `mutation.isPending`. Export as default.

- [X] T014 [US3] Create `src/app/(admin)/dashboard/coupons/[id]/edit/page.tsx` — `'use client'`. Import `useParams` from `next/navigation`. Import `useQuery` from `@tanstack/react-query`. Import `couponService` from `@/services/coupon.service`. Import `couponKeys` from `@/components/features/coupons/couponKeys`. Import `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger` from `@/components/ui/tabs`. Import `Skeleton` from `@/components/ui/skeleton`. Import `CouponEditForm` from `@/components/features/coupons/CouponEditForm`. Import `AdminCoupon` from `@/types/admin/coupons`. Inside component: `const { id } = useParams<{ id: string }>()`. Query: `useQuery({ queryKey: couponKeys.detail(id), queryFn: () => couponService.adminGetCouponDetail(id), enabled: !!id })`. If `isPending`: show Skeleton grid matching the form layout. If `isError`: show error message card. If `data`: render page header "Edit Coupon: {data.code}" + `<Tabs defaultValue="details">`. Tab triggers: "Details", "Scoping" (hidden if `data.scope === 'global(order)'`), "Usage". TabsContent "details": `<CouponEditForm coupon={data} />`. TabsContent "scope": `<div>Scoping tab — coming in US7</div>` (placeholder, replaced in Phase 9). TabsContent "usage": `<div>Usage tab — coming in US5</div>` (placeholder, replaced in Phase 7). Export as default function `EditCouponPage`.

- [X] T015 [US3] Update `src/app/(admin)/dashboard/coupons/page.tsx` — Replace the placeholder `{editCoupon && <div>Edit dialog coming in US3</div>}` with navigation logic: when `onEdit(coupon)` is called by `CouponTableRow`, use `router.push(\`/dashboard/coupons/${coupon.id}/edit\`)` instead of state. Import `useRouter` from `next/navigation`. Remove `editCoupon` state variable. Update `CouponListTable` `onEdit` prop to call `(c) => router.push(\`/dashboard/coupons/${c.id}/edit\`)`.

**Checkpoint (US3)**: Click edit on a list row → navigates to `/dashboard/coupons/{id}/edit`. Form shows pre-populated values. Code field is disabled. Change Values → Save → success toast. Navigate back to list → row reflects updated values. TypeScript zero errors.

---

## Phase 6: User Story 4 — Toggle Coupon Active Status (Priority: P2)

**Goal**: The one-click toggle in the list row already has its mutation wired in T010. This phase ensures the toggle is robust (optimistic indication, correct re-fetch, error revert).

**Independent Test**: Click the toggle on an Active coupon. Toggle button shows loading state. Status badge flips to Inactive. Click again → flips back to Active. Network shows `PUT /coupons/admin/coupon/{id}/` each time.

### Implementation for User Story 4

- [X] T016 [US4] Refine toggle mutation in `src/app/(admin)/dashboard/coupons/page.tsx` — The toggle mutation from T010 calls `adminUpdateCoupon(id, { ...foundCoupon, is_active: !foundCoupon.is_active })`. Update the implementation to properly find the coupon from the query data before mutating: `const coupons = queryClient.getQueryData<AdminCoupon[]>(couponKeys.all) ?? []; const found = coupons.find(c => c.id === id); if (!found) return; toggleMutation.mutate({ id, payload: { ...found, is_active } })`. Ensure the `mutationFn` receives the full payload so the backend `PUT` has all required fields (`scope`, `discount_type`, `discount_value`, `start_at`, `end_at`, `is_active`). The mutation type parameter should be `{ id: number; payload: AdminCouponPayload }`. The `onMutate` sets `togglingId` to the coupon ID, `onSettled` always clears it.

**Checkpoint (US4)**: Toggle buttons work correctly. During mutation: button is disabled, `togglingId` matches button's coupon ID. After success: status badge updates, cache refreshes. After error: toast error shown, status badge unchanged.

---

## Phase 7: User Story 5 — View Coupon Usage History (Priority: P3)

**Goal**: Modal dialog opened from the list row "Usage" icon that shows all redemptions for that coupon.

**Independent Test**: Click the History icon on any coupon row. A modal opens. If there are redemptions, table shows user/order/date. If empty, shows empty state. Closing the modal returns to the list unchanged.

### Implementation for User Story 5

- [X] T017 [US5] Create `src/components/features/coupons/CouponUsageModal.tsx` — Props: `{ coupon: AdminCoupon | null; onClose: () => void }`. Import `useQuery` from `@tanstack/react-query`. Import `couponService` from `@/services/coupon.service`. Import `couponKeys` from `./couponKeys`. Import `AdminCouponUsage` from `@/types/admin/coupons` (add this type to `src/types/admin/coupons.ts` if not present: `export interface AdminCouponUsage { id: number; user: string; order: string; used_at: string; }`). Import Shadcn: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` from `@/components/ui/dialog`; `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow` from `@/components/ui/table`; `Skeleton` from `@/components/ui/skeleton`. Query: `useQuery({ queryKey: couponKeys.usages(coupon?.id ?? 0), queryFn: () => couponService.adminCouponUsages(coupon!.id), enabled: !!coupon })`. The dialog `open` prop = `!!coupon`. `onOpenChange`: calls `onClose()` when set to false. If `isPending`: 3 skeleton rows. If empty results: centered text "No redemptions recorded yet." If data: `<Table>` with columns: User, Order, Used At. Each row shows `usage.user`, `usage.order`, `new Date(usage.used_at).toLocaleString()`. Export as default.

- [X] T018 [US5] Update `src/app/(admin)/dashboard/coupons/page.tsx` — Replace placeholder `{usageCoupon && <div>Usage modal coming in US5</div>}` with `<CouponUsageModal coupon={usageCoupon} onClose={() => setUsageCoupon(null)} />`. Add import. Note: render `CouponUsageModal` unconditionally (the dialog's `open` prop handles visibility) to preserve React hook call order.

- [X] T019 [US5] Add "Usage" tab content to `src/app/(admin)/dashboard/coupons/[id]/edit/page.tsx` — Replace the placeholder `<div>Usage tab — coming in US5</div>` with `<CouponUsageModal coupon={data} onClose={() => {}} />` — but since it's inside a tab (not a modal), render the table directly without the Dialog wrapper. Create a separate `CouponUsageTable.tsx` component that only renders the query + table content (no Dialog), and use it both in the modal and the edit page tab. Alternatively: extract the table body from `CouponUsageModal` into a `CouponUsageTable` sub-component, then use `CouponUsageTable` in both `CouponUsageModal` (inside Dialog) and the edit page's Usage tab. **Implement the simpler approach**: create `src/components/features/coupons/CouponUsageTable.tsx` with props `{ couponId: number }` that renders only the query + table. Update `CouponUsageModal` to use `CouponUsageTable`. Update edit page Usage tab to render `<CouponUsageTable couponId={data.id} />`.

**Checkpoint (US5)**: Click History icon on list → modal opens with usage table or empty state. Close modal → list unchanged. Open edit page → Usage tab shows same data without a modal wrapper.

---

## Phase 8: User Story 6 — Delete a Coupon (Priority: P3)

**Goal**: Delete confirmation dialog from list row. On confirm, coupon removed from list.

**Independent Test**: Click Delete on a coupon → AlertDialog appears. Click Cancel → dialog closes, coupon still in list. Click Delete (confirm) → coupon removed from list, success toast shown.

### Implementation for User Story 6

- [ ] T020 [US6] Create `src/components/features/coupons/CouponDeleteDialog.tsx` — Props: `{ coupon: AdminCoupon | null; onClose: () => void }`. Import `useMutation`, `useQueryClient` from `@tanstack/react-query`. Import `couponService`, `authService`. Import `couponKeys`. Import `toast` from `sonner`. Import `AdminCoupon` from `@/types/admin/coupons`. Import `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogTitle` from `@/components/ui/alert-dialog`. Mutation: `useMutation({ mutationFn: (id: number) => couponService.adminDeleteCoupon(id), onSuccess: async () => { await authService.clearCache(); queryClient.invalidateQueries({ queryKey: couponKeys.all }); toast.success('Coupon deleted'); onClose(); }, onError: () => toast.error('Failed to delete coupon') })`. Dialog `open` = `!!coupon`. `onOpenChange(false)` → calls `onClose()`. Display: "Delete Coupon?" title, "This will permanently delete coupon code **{coupon?.code}**. This action cannot be undone." description. Footer: Cancel (AlertDialogCancel) + Delete button (AlertDialogAction, `className="bg-destructive text-white"`, `onClick={() => coupon && mutation.mutate(coupon.id)}`, disabled when `mutation.isPending`, text: "Deleting…" or "Delete"). Export as default.

- [ ] T021 [US6] Update `src/app/(admin)/dashboard/coupons/page.tsx` — Replace placeholder `{deleteCoupon && <div>Delete dialog coming in US6</div>}` with `<CouponDeleteDialog coupon={deleteCoupon} onClose={() => setDeleteCoupon(null)} />`. Add import. Render unconditionally (dialog handles visibility via `open` prop).

**Checkpoint (US6)**: Delete flow works end-to-end. Cancel closes without deleting. Confirm calls `DELETE /coupons/admin/coupon/{id}/`, refreshes list, closes dialog. Success toast shown.

---

## Phase 9: User Story 7 — Resource Scoping (Priority: P2)

**Goal**: Scoping tab in the edit page for product/category/package-scoped coupons. Resource picker fed by `catalogService` and `topupService`. Per-resource add/remove mutations.

**Independent Test**: Open edit page for a `product`-scoped coupon. Scoping tab is visible. Search for a product, select it, click "Add" → product appears in attached list. Click Remove → product removed. Open edit for `global(order)` coupon → Scoping tab is hidden.

**⚠️ NOTE**: The Scoping tab is ONLY shown when `coupon.scope !== 'global(order)'`. This is already handled by the tab visibility logic in T014.

### Implementation for User Story 7

- [X] T022 [P] [US7] Create `src/components/features/coupons/CouponProductPicker.tsx` — Props: `{ couponId: number }`. Import `useState`. Import `useQuery`, `useMutation`, `useQueryClient` from `@tanstack/react-query`. Import `catalogService` from `@/services/catalog.service`. Import `couponService`, `authService`. Import `couponKeys`. Import `toast`. Import `Input` from `@/components/ui/input`; `Button` from `@/components/ui/button`; `Skeleton` from `@/components/ui/skeleton`. Query: `useQuery({ queryKey: ['admin', 'products'], queryFn: () => catalogService.adminProductsList() })` — normalize to array. State: `search: string`, `selected: string[]` (array of product IDs/slugs selected for batch add). Filter displayed products by `search` string (client-side, by `product.name` or `product.title` — check the `Product` type for the name field). Add mutation: `useMutation({ mutationFn: (ids: string[]) => couponService.adminAddProductsToCoupon(couponId, { resource_ids: ids }), onSuccess: async () => { await authService.clearCache(); queryClient.invalidateQueries({ queryKey: couponKeys.detail(couponId) }); toast.success('Products added'); setSelected([]); }, onError: () => toast.error('Failed to add products') })`. Render: search Input, then a scrollable list of products with checkboxes. Each product row: `<input type="checkbox">` + product name/slug. "Add Selected" Button (disabled if `selected.length === 0` or `addMutation.isPending`). Export as default.

- [X] T023 [P] [US7] Create `src/components/features/coupons/CouponCategoryPicker.tsx` — Same pattern as T022 but for categories. Query: `useQuery({ queryKey: ['admin', 'categories'], queryFn: () => catalogService.adminCategoriesList() })`. Add mutation uses `couponService.adminAddCategoryToCoupon(couponId, { resource_ids: ids })`. Invalidates `couponKeys.detail(couponId)`. Render category name + slug in the list. Export as default.

- [X] T024 [US7] Create `src/components/features/coupons/CouponPackagePicker.tsx` — Slightly more complex: packages are nested under topups. Import `topupService`. Step 1: Query all topups: `useQuery({ queryKey: ['admin', 'topups'], queryFn: () => topupService.adminTopupsList() })`. Step 2: For a selected topup slug, query its packages: `const [selectedTopup, setSelectedTopup] = useState<string>('')`. `useQuery({ queryKey: ['admin', 'packages', selectedTopup], queryFn: () => topupService.adminPackagesList(selectedTopup), enabled: !!selectedTopup })`. Render: (a) topup selector — a `<Select>` to pick which topup's packages to browse; (b) package list with checkboxes once a topup is selected. Add mutation: `couponService.adminAddPackageToCoupon(couponId, { resource_ids: packageIds })`. Invalidates `couponKeys.detail(couponId)`. When `selectedTopup` is empty, show "Select a game/topup first" prompt. Export as default.

- [X] T025 [US7] Create `src/components/features/coupons/CouponScopingTab.tsx` — Props: `{ coupon: AdminCoupon }`. Import `couponService`, `useQuery`, `useMutation`, `useQueryClient`, `couponKeys`, `authService`, `toast`. Import `CouponProductPicker` from `./CouponProductPicker`. Import `CouponCategoryPicker` from `./CouponCategoryPicker`. Import `CouponPackagePicker` from `./CouponPackagePicker`. Import `Button` from `@/components/ui/button`. Import `Trash2` from `lucide-react`. This component shows: (a) the picker (only the matching scope type), and (b) the currently attached resources list with Remove buttons. For the currently-attached resources: use `useQuery({ queryKey: couponKeys.detail(coupon.id), queryFn: () => couponService.adminGetCouponDetail(coupon.id) })` — the detail response is expected to include arrays of attached products/categories/packages. **If the detail response does NOT include attached resources** (needs verification by checking the API response during impl): show a note "Resource list not available via current API — use picker to add". Remove mutations: one for each resource type, each calling the appropriate `adminDelete<X>FromCoupon` endpoint, followed by `authService.clearCache()` + `queryClient.invalidateQueries({ queryKey: couponKeys.detail(coupon.id) })`. Render: heading showing scope type, the picker component, divider "Currently Attached", list of attached resources with per-row Trash2 remove button. If `coupon.scope === 'global(order)'` render `<p>Global coupons apply to all orders. No resource restrictions.</p>` and return early. Export as default.

- [X] T026 [US7] Update `src/app/(admin)/dashboard/coupons/[id]/edit/page.tsx` — Replace the placeholder `<div>Scoping tab — coming in US7</div>` with `<CouponScopingTab coupon={data} />`. Add import.

**Checkpoint (US7)**: Edit page for `product`-scoped coupon → Scoping tab visible → can search products, select, add, see confirmation. Edit page for `global(order)` coupon → Scoping tab hidden (tab trigger not rendered because of T014 visibility condition).

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, edge cases, and quality checks across all components.

- [X] T027 Verify `src/types/admin/coupons.ts` has `AdminCouponUsage` interface (`{ id: number; user: string; order: string; used_at: string; }`) — add it if missing. Also verify `DiscountType` and `ScopeType` are exported. Add `export type ScopeType = 'global(order)' | 'product' | 'package' | 'category';` if not present.

- [X] T028 [P] Audit all component files in `src/components/features/coupons/` — Check each file for: (a) any `useEffect` used for data fetching (FORBIDDEN — only allowed for form reset); (b) any `any` type usage (replace with proper types); (c) all `useMutation.onSuccess` handlers call `authService.clearCache()` before `queryClient.invalidateQueries`. Fix all violations.

- [X] T029 [P] Responsive layout check — Open `/dashboard/coupons` at 375px width (mobile). Table should scroll horizontally inside its container. Open with Chrome DevTools device emulation. Ensure the page header and filter tabs stack correctly on mobile. Add `overflow-x-auto` wrapper on table container in `CouponListTable.tsx` if not present.

- [X] T030 [P] Verify the Scoping tab `AdminCoupon` detail response structure — During runtime, `console.log` the `adminGetCouponDetail` response in `CouponScopingTab` to confirm whether it returns attached `products`, `categories`, or `packages` arrays. If the API returns them: wire the remove buttons to the real data. If it does not return them: add a note in `CouponScopingTab` that removal must be done after adding (the add operation invalidates the cache and re-fetches). Remove the `console.log` after verifying.

- [X] T031 Run TypeScript type check from repo root: `npx tsc --noEmit`. Fix every error before marking this task done. Zero TypeScript errors required.

- [X] T032 Verify complete constitution compliance: (a) Open list page — confirm no raw `useEffect` data fetch in console (no "fetching" log from old code); (b) Create a coupon — confirm network shows `POST /coupons/admin/all/` then `POST /auth/clear-cache/` then `GET /coupons/admin/all/`; (c) Edit a coupon — confirm `PUT` then `clear-cache` then `GET`; (d) Delete a coupon — confirm `DELETE` then `clear-cache` then `GET`; (e) Toggle — confirm `PUT` then `clear-cache` then `GET`. All 9 constitution gates must pass.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 completion
- **Phase 3 (US1 — List)**: Depends on Phase 2 — MUST complete before Phases 4–9
- **Phase 4 (US2 — Create)**: Depends on Phase 3 (uses list page state)
- **Phase 5 (US3 — Edit)**: Depends on Phase 3 (uses navigation from list)
- **Phase 6 (US4 — Toggle)**: Depends on Phase 3 T010 (toggle mutation already wired there, just needs refinement)
- **Phase 7 (US5 — Usage)**: Depends on Phase 5 (usage tab is inside edit page)
- **Phase 8 (US6 — Delete)**: Depends on Phase 3 (uses list page state)
- **Phase 9 (US7 — Scoping)**: Depends on Phase 5 (scoping tab is inside edit page)
- **Phase 10 (Polish)**: Depends on all Phases 3–9

### Within-Phase Task Order

```
Phase 1: T001 → T002 → T003 → T004 (sequential, each builds on prior)
Phase 2: T006 → T007 (T007 can be parallel with T006)
Phase 3: T008 → T009 → T010 (sequential — Row needed for Table, Table needed for Page)
Phase 4: T011 → T012 (Dialog before wiring it into page)
Phase 5: T013 → T014 → T015 (Form before Page, Page before navigation update)
Phase 6: T016 (single task)
Phase 7: T017 → T019 → T018 (UsageTable before UsageModal, then wire into page)
Phase 8: T020 → T021 (Dialog before wiring)
Phase 9: T022 + T023 (parallel) → T024 → T025 → T026 (pickers before orchestrator, orchestrator before page)
Phase 10: T027 + T028 + T029 (parallel) → T030 → T031 → T032
```

### Parallel Opportunities

```
# Phase 2 (run together):
T006: CouponStatusBadge.tsx
T007: CouponListFilters.tsx

# Phase 9 (run T022 + T023 together):
T022: CouponProductPicker.tsx
T023: CouponCategoryPicker.tsx

# Phase 10 (run T027 + T028 + T029 together):
T027: Type audit
T028: Constitution audit
T029: Responsive check
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 — List + Create)

1. Complete Phase 1 (Setup) — T001–T004
2. Complete Phase 2 (Foundational) — T006–T007
3. Complete Phase 3 (US1 — List) — T008–T010
4. **STOP and VALIDATE**: Navigate to `/dashboard/coupons` — table loads, filters work, toggle works
5. Complete Phase 4 (US2 — Create) — T011–T012
6. **STOP and VALIDATE**: Create form works with full Zod validation

### Incremental Delivery (All Stories)

1. MVP above ✅
2. Phase 5 (Edit page + tabs) → validate edit flow
3. Phase 6 (Toggle refinement) → verify toggle robustness
4. Phase 8 (Delete) → validate delete flow
5. Phase 7 (Usage history) → validate modal + tab
6. Phase 9 (Resource scoping) → validate per-scope pickers
7. Phase 10 (Polish) → TypeScript zero-error gate + constitution check

---

## Notes

- **Coupon service imports**: After T001, all imports of `AdminCouponPayload` from `@/types` in `coupon.service.ts` become `@/types/admin/coupons`. If there are conflicts with `src/types/coupon.ts`, the `admin/coupons.ts` version wins (it has the confirmed backend schema).
- **Toggle payload**: The `adminUpdateCoupon` PUT endpoint requires all payload fields. The toggle must send the full coupon payload with only `is_active` changed, not just `{ is_active: true }`.
- **DateTime formatting**: `datetime-local` HTML input values look like `"2026-05-01T00:00"`. The Zod schema uses `z.string().min(1)` (not `z.string().datetime()`) to avoid strict ISO format issues with this input type. Transformation to ISO may be needed in the submit handler.
- **`global(order)` scope**: This string contains parentheses. Ensure it is always quoted in comparisons: `coupon.scope === 'global(order)'`. Do not destructure or parse this value.
- **Package picker complexity**: If `topupService.adminPackagesList(slug)` requires an existing topup slug, the picker must first select a topup. If the API returns all packages without needing a slug, simplify accordingly — check response shape at runtime.
- **[P] tasks** = can be started in parallel with other [P] tasks in the same phase (different files, no shared dependencies within the phase).
