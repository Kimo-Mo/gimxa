# Tasks: User Management (Admin) — Phase 4

**Input**: Design documents from `specs/004-user-management/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/api.md ✅

**Tests**: Not requested — no test tasks generated.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no unresolved dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Exact file paths are included in every task description

---

## Shared Context (read before implementing ANY task)

### Tech stack
- **Next.js 15** App Router, `'use client'` where interactivity is needed
- **TanStack React Query v5** — `useQuery` for fetches, `useMutation` for writes
- **Shadcn UI** — `Dialog`, `AlertDialog`, `Table`, `Badge`, `Input`, `Button`, `Select`, `Skeleton`
- **Tailwind CSS 4** — no inline `style` props, no external CSS files
- **Axios `api` instance** from `src/lib/api/axios` — never use raw `fetch`
- **Strict TypeScript** — zero `any`, use `unknown` + type narrowing if shape is uncertain

### Mandatory mutation pattern (constitution-enforced)
Every `useMutation` `onSuccess` MUST execute this exact sequence:
```ts
const cacheClear = useCacheClear(); // from src/hooks/admin/useCacheClear.ts
// inside onSuccess:
await cacheClear();                                          // 1. clear Django backend cache
queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }); // 2. refresh React Query cache
```

### Key existing files (read before modifying)
| File | Purpose |
|---|---|
| `src/hooks/admin/queryKeys.ts` | Central query key factory — extend, never duplicate |
| `src/hooks/admin/useCacheClear.ts` | Returns `cacheClear()` async fn |
| `src/services/user.service.ts` | `adminUsersList`, `adminUpdateUser`, `adminDeleteUser`, `getUserProfile` |
| `src/services/auth.service.ts` | `forgotPassword({ email })` — used for password reset |
| `src/types/admin/users.ts` | `AdminUser`, `AdminUpdateUserPayload`, `UserListParams`, `RoleEnum`, `ProviderEnum` |
| `src/app/(admin)/dashboard/orders/page.tsx` | Reference implementation — debounce, URL params, pagination, modal pattern |
| `src/components/admin/modals/OrderDetailsModal.tsx` | Reference modal implementation |

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Extend types and query keys — foundational to all user stories.

- [x] T001 Extend `src/types/admin/users.ts` — add `UserProfileResponse` and `UserOrderSummary` interfaces exactly as defined in `specs/004-user-management/data-model.md` (Entities section 2 and 3). Use `OrderStatus` imported from `src/types/admin/orders.ts` for the `status` field on `UserOrderSummary`. Do NOT modify `AdminUser`, `UserListParams`, or `RoleEnum`.

- [x] T002 Extend `src/hooks/admin/queryKeys.ts` — add two new keys to the `adminQueryKeys` object:
  - `users: (params: UserListParams) => ['admin', 'users', params] as const`
  - `user: (id: string) => ['admin', 'user', id] as const`
  Import `UserListParams` from `@/types/admin/users`. Add the import at the top of the file alongside existing imports. Do NOT remove or rename any existing keys.

**Checkpoint**: Types compile and query key factory exports all keys without TypeScript errors.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Query and mutation hooks that all UI components depend on. Must be complete before any UI is built.

**⚠️ CRITICAL**: No user story UI work can begin until this phase is complete.

- [x] T003 Create `src/hooks/admin/useAdminUsersQuery.ts` — a custom hook that wraps `userService.adminUsersList(params)` with `useQuery`. Use `adminQueryKeys.users(params)` as the query key. Accept a `params: UserListParams` argument. Return the full `useQuery` result. The return type of `data` should be the paginated shape: `{ count: number; total_pages: number; current_page: number; page_size: number; next: string | null; previous: string | null; results: AdminUser[] }`. Import `AdminUser` from `@/types/admin/users` and `userService` from `@/services/user.service`.

  ```ts
  // Exact signature:
  export function useAdminUsersQuery(params: UserListParams) {
    return useQuery({
      queryKey: adminQueryKeys.users(params),
      queryFn: () => userService.adminUsersList(params),
    });
  }
  ```

- [x] T004 Create `src/hooks/admin/useAdminUserProfileQuery.ts` — a custom hook that wraps `userService.getUserProfile(userId)` with `useQuery`. Use `adminQueryKeys.user(userId)` as the query key. Accept `userId: string | null`. The query must only fire when `userId` is a non-null, non-empty string — use the `enabled: !!userId` option. Return type of `data` is `UserProfileResponse`. Import `UserProfileResponse` from `@/types/admin/users`.

  ```ts
  // Exact signature:
  export function useAdminUserProfileQuery(userId: string | null) {
    return useQuery({
      queryKey: adminQueryKeys.user(userId ?? ''),
      queryFn: () => userService.getUserProfile(userId!),
      enabled: !!userId,
    });
  }
  ```

- [x] T005 Create `src/hooks/admin/useAdminUserMutations.ts` — export three named hooks from a single file. Follow the pattern in `src/hooks/admin/useAdminOrderMutations.ts` (read that file first as reference). Each hook uses `useMutation`, calls `useCacheClear`, and in `onSuccess` runs `cacheClear()` then `queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })`.

  **Hook 1 — `useDeleteUserMutation`**:
  - `mutationFn: (userId: string) => userService.adminDeleteUser(userId)`
  - `onSuccess`: cacheClear → invalidate `['admin', 'users']`
  - `onError`: accept an optional `onError` callback prop

  **Hook 2 — `useRoleChangeMutation`**:
  - `mutationFn: ({ userId, role }: { userId: string; role: RoleEnum }) => userService.adminUpdateUser(userId, { role })`
  - `onSuccess`: cacheClear → invalidate `['admin', 'users']` + `['admin', 'user', userId]`

  **Hook 3 — `useResetPasswordMutation`**:
  - `mutationFn: (email: string) => authService.forgotPassword({ email })`
  - Import `authService` from `@/services/auth.service`
  - `onSuccess`: cacheClear → invalidate `['admin', 'users']` (no user cache needed — no data changes)
  - No `onError` callback needed; errors are handled by the calling component via `isError`/`error`

  Import `RoleEnum` from `@/types/admin/users`. Import `useQueryClient` from `@tanstack/react-query`.

**Checkpoint**: All three hooks are importable and TypeScript compiles with zero errors.

---

## Phase 3: User Story 1 — User List with Search & Filters (Priority: P1) 🎯 MVP

**Goal**: Deliver a fully functional, paginated user list at `/dashboard/users` with debounced live search and four filter dropdowns. The user list table must display all required columns, handle loading skeletons, and show an empty state.

**Independent Test**: Load `/dashboard/users`. Verify the table renders with skeleton rows while loading, then shows user rows. Type a search term — after ~400ms the table auto-updates. Apply a role filter — list filters server-side. Navigate pages with Prev/Next buttons.

### Implementation for User Story 1

- [x] T006 [P] [US1] Create `src/components/admin/users/UserRoleBadge.tsx` — a small presentational component that accepts `role: RoleEnum` and renders a Shadcn `Badge` with colour-coded variants:
  - `'admin'` → `variant="destructive"` (red) with text "Admin"
  - `'user'` → `variant="secondary"` with text "User"
  - `'seller'` → `variant="outline"` with text "Seller"
  - `'developer'` → `variant="default"` with text "Developer"
  - Any other value → `variant="outline"` displaying the raw role string
  Import `Badge` from `@/components/ui/badge`. Import `RoleEnum` from `@/types/admin/users`. This component has no state and no side effects.

- [x] T007 [P] [US1] Create `src/components/admin/users/UserFilters.tsx` — a component that renders the search input and four filter dropdowns. Accept these props:
  ```ts
  interface UserFiltersProps {
    searchValue: string;
    onSearchChange: (value: string) => void;
    roleFilter: string;
    onRoleChange: (value: string) => void;
    isActiveFilter: string;
    onIsActiveChange: (value: string) => void;
    providerFilter: string;
    onProviderChange: (value: string) => void;
    isVerifiedFilter: string;
    onIsVerifiedChange: (value: string) => void;
  }
  ```
  - Render a search `Input` (with a `Search` icon from `lucide-react`) that calls `onSearchChange` on every keystroke — the debounce is handled by the parent page, NOT here.
  - Render four Shadcn `Select` dropdowns:
    - **Role**: options `all` (label "All Roles"), `user`, `admin`, `seller`, `developer`
    - **Status**: options `all` (label "All Statuses"), `true` (label "Active"), `false` (label "Inactive")
    - **Provider**: options `all` (label "All Providers"), `email`, `google`, `facebook`
    - **Verified**: options `all` (label "All"), `true` (label "Verified"), `false` (label "Unverified")
  - Import `Input` from `@/components/ui/input`, `Select`/`SelectContent`/`SelectItem`/`SelectTrigger`/`SelectValue` from `@/components/ui/select`, `Search` from `lucide-react`.
  - Layout: flex row on sm+, flex col on mobile. Wrap in a `<div className="flex flex-col sm:flex-row gap-3 flex-wrap">`.

- [x] T008 [US1] Create `src/components/admin/users/UserTableRow.tsx` — a single table row component. Accept these props:
  ```ts
  interface UserTableRowProps {
    user: AdminUser;
    onClick: (userId: string) => void;
  }
  ```
  Render a `TableRow` (import from `@/components/ui/table`) with these columns in order:
  1. Avatar — use `user.avatar` in a 32×32 rounded img, or a fallback `UserCircle` icon from `lucide-react` if `avatar` is null
  2. Username — `user.username` (bold, `text-foreground`)
  3. Email — `user.email` (`text-muted-foreground text-sm`)
  4. Full name — `user.full_name ?? '—'` (`text-sm`)
  5. Role — `<UserRoleBadge role={user.role} />`
  6. Status — a `Badge` variant `"default"` with text "Active" if `user.is_active`, or `variant="outline"` with text "Inactive"
  7. Provider — plain text, capitalised first letter (`email` → "Email", `google` → "Google", etc.)
  8. Verified — a green `CheckCircle2` icon if `user.is_verified`, or a grey `XCircle` icon (both from `lucide-react`)
  9. Actions column — a single "View" `Button` (variant `"ghost"`, size `"sm"`) with `Eye` icon that calls `onClick(user.id)` on click

  The entire `TableRow` should NOT be clickable — only the "View" button triggers the modal (prevents accidental opens).

- [x] T009 [US1] Create `src/components/admin/users/UserTable.tsx` — the full data table. Accept these props:
  ```ts
  interface UserTableProps {
    users: AdminUser[];
    isPending: boolean;
    isError: boolean;
    totalPages: number;
    currentPage: number;
    totalCount: number;
    onPageChange: (page: number) => void;
    onUserClick: (userId: string) => void;
  }
  ```
  Render structure:
  - A Shadcn `Table` with `TableHeader` containing columns: Avatar, Username, Email, Full Name, Role, Status, Provider, Verified, Actions
  - **Loading state** (`isPending`): render 5 skeleton `TableRow` instances. Each row has `TableCell` entries containing `Skeleton` components (`h-4 w-{appropriate}` sizing for each column). Copy the skeleton pattern from `src/app/(admin)/dashboard/orders/page.tsx`.
  - **Error state** (`isError`): a single `TableRow` spanning all 9 columns with centered red text "Failed to load users. Please try again."
  - **Empty state** (`!isPending && users.length === 0`): a single `TableRow` spanning all 9 columns with centered muted text and a `Users` icon (lucide-react): "No users found matching your criteria."
  - **Data rows**: map `users` → `<UserTableRow key={user.id} user={user} onClick={onUserClick} />`
  - **Pagination controls** (only if `totalPages > 1`): render below the table, identical layout to orders page — left side shows "Page X of Y (Z total)", right side has `ChevronLeft`/`ChevronRight` `Button` (variant `"outline"`, size `"sm"`) calling `onPageChange`.

- [x] T010 [US1] Replace `src/app/(admin)/dashboard/users/page.tsx` with the full User List page implementation. This is the orchestrator component — it must NOT contain business logic; it only wires hooks and components together. Follow the orders page pattern exactly (`src/app/(admin)/dashboard/orders/page.tsx`). Implementation steps:

  1. **Mark as client**: `'use client';` at top
  2. **URL state** (same pattern as orders page):
     ```ts
     const searchParams = useSearchParams();
     const router = useRouter();
     const pathname = usePathname();
     const search = searchParams.get('search') ?? '';
     const role = searchParams.get('role') ?? '';
     const isActive = searchParams.get('is_active') ?? '';
     const provider = searchParams.get('provider') ?? '';
     const isVerified = searchParams.get('is_verified') ?? '';
     const page = Number(searchParams.get('page') ?? '1');
     const [searchInput, setSearchInput] = useState(search);
     const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
     ```
  3. **`updateParams` helper** (copy exactly from orders page, same pattern)
  4. **Stable ref + URL sync** for `updateParams` and `searchInput` (copy the `useRef` + `useEffect` pattern from orders page lines 78–92)
  5. **Debounce effect** (400ms timeout, same as orders page):
     ```ts
     useEffect(() => {
       const id = setTimeout(() => {
         if ((searchInput || null) !== (search || null)) {
           updateParamsRef.current({ search: searchInput || null, page: null });
         }
       }, 400);
       return () => clearTimeout(id);
     }, [searchInput, search]);
     ```
  6. **Query**:
     ```ts
     const queryParams: UserListParams = {
       search: search || undefined,
       role: role || undefined,
       is_active: isActive ? isActive === 'true' : undefined,
       provider: provider || undefined,
       is_verified: isVerified ? isVerified === 'true' : undefined,
       page,
       page_size: 10,
     };
     const { data, isPending, isError } = useAdminUsersQuery(queryParams);
     const users = data?.results ?? [];
     ```
  7. **Filter change handlers**: each calls `updateParams({ <key>: value === 'all' ? null : value, page: null })`
  8. **JSX structure**:
     ```tsx
     <div className="space-y-8">
       <div>
         <h1 className="text-3xl font-bold tracking-tight text-foreground">User Management</h1>
         <p className="text-muted-foreground mt-1">Manage registered user accounts and privileges.</p>
       </div>
       <Card className="bg-card border-border shadow-sm">
         <CardHeader className="pb-4">
           <CardTitle className="text-foreground">Users</CardTitle>
           <UserFilters ... />
         </CardHeader>
         <CardContent>
           <UserTable ... />
         </CardContent>
       </Card>
       <UserProfileModal
         userId={selectedUserId}
         onClose={() => setSelectedUserId(null)}
       />
     </div>
     ```
  9. Pass `onUserClick={(id) => setSelectedUserId(id)}` to `<UserTable>`. Render `<UserProfileModal>` always (it uses `userId` as its open-state trigger).
  10. Import all components and hooks. Import `Card`/`CardHeader`/`CardContent`/`CardTitle` from `@/components/ui/card`.

**Checkpoint — US1**: Navigate to `/dashboard/users`. The page renders a header, filters, and table. Skeleton rows appear during load. Real user rows appear after load. Typing in search debounces and re-fetches. Dropdowns apply filters. Pagination controls appear when `total_pages > 1`.

---

## Phase 4: User Story 2 — User Profile & Order History Modal (Priority: P2)

**Goal**: Clicking "View" on any user row opens a modal with the user's account details and a list of their orders. The modal closes on X click or outside-click and restores list state.

**Independent Test**: Click "View" on a user. A centered modal opens showing the user's username, email, role badge, status, provider, verified status, join date. Below account details, an "Order History" section lists orders or shows an empty state. Close modal — returns to list with previous search/page intact.

### Implementation for User Story 2

- [x] T011 [US2] Create `src/components/admin/users/UserProfileModal.tsx` — a Shadcn `Dialog` that displays user details and order history. Accept these props:
  ```ts
  interface UserProfileModalProps {
    userId: string | null;  // null = modal closed
    onClose: () => void;
  }
  ```

  **Open state**: `open={!!userId}`. The Dialog `onOpenChange` should call `onClose()` when closed.

  **Data fetching**: inside the component, call `useAdminUserProfileQuery(userId)`. Since the query has `enabled: !!userId`, it will only fetch when the modal is open.

  **Layout** (inside `DialogContent` — size `"max-w-2xl"`):
  - `DialogHeader` with `DialogTitle`: user's `full_name ?? username` + `UserRoleBadge`
  - `DialogDescription`: user's email

  **Account Details section** (grid 2-col on sm+):
  - Username, Email, Full Name, Role, Status (Active/Inactive badge), Provider, Verified (Yes/No), Joined (formatted `date_joined`), Last Login (formatted `last_login ?? 'Never'`), Last Updated

  **Loading state** (`isPending`): render 4–5 `Skeleton` lines for account details section, then 3 `Skeleton` lines for order history

  **Error state** (`isError`): red text "Failed to load profile."

  **Order History section** (below a `Separator` from `@/components/ui/separator`):
  - Section heading: `<h3 className="font-semibold text-foreground">Order History</h3>`
  - If no orders (`data.orders.length === 0`): muted text with `ShoppingBag` icon (lucide): "No orders yet."
  - Orders list: a compact table or list of orders, each row showing: order number (#ORD-XXX), date (`new Date(created_at).toLocaleDateString()`), status (`OrderStatusBadge` — import from `src/components/admin/orders/OrderStatusBadge.tsx`), and total price (`$XX.XX`). Max 10 rows displayed (no pagination in modal).

  **Footer section**: render `<UserActionButtons>` (created in Phase 5) inside a `DialogFooter`.

  Import `Dialog`/`DialogContent`/`DialogHeader`/`DialogTitle`/`DialogDescription`/`DialogFooter` from `@/components/ui/dialog`. Import `Separator` from `@/components/ui/separator`. Import `useAdminUserProfileQuery` from `@/hooks/admin/useAdminUserProfileQuery`.

**Checkpoint — US2**: Clicking "View" opens the modal. Account details and order history display correctly. Modal closes on X or outside click. List page is still visible behind modal with unchanged state.

---

## Phase 5: User Story 3 — Delete User (Priority: P3)

**Goal**: A "Delete" button inside the profile modal opens an `AlertDialog` asking for confirmation. On confirm, the user is permanently deleted and the list refreshes. On cancel, nothing changes.

**Independent Test**: Open a user's profile modal. Click "Delete User". An `AlertDialog` appears with an irreversible-action warning and "Cancel" / "Confirm Delete" buttons. Click Cancel → dialog closes, user account intact. Click Confirm Delete → user disappears from the list within 2s. If delete fails, a visible error message appears and the user remains in the list.

### Implementation for User Story 3

- [x] T012 [P] [US3] Create `src/components/admin/users/DeleteUserDialog.tsx` — a Shadcn `AlertDialog` for delete confirmation. Accept these props:
  ```ts
  interface DeleteUserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    username: string;
    onConfirm: () => void;
    isPending: boolean;
  }
  ```
  Content:
  - `AlertDialogTitle`: "Delete User Account"
  - `AlertDialogDescription`: "This will permanently delete **{username}**'s account and all associated data. This action cannot be undone."
  - Cancel button: `AlertDialogCancel` — text "Cancel". Disabled when `isPending`.
  - Confirm button: `AlertDialogAction` — text "Delete Account" (or show `Loader2` spinner from lucide when `isPending`). Apply `className="bg-destructive text-destructive-foreground hover:bg-destructive/90"`. Calls `onConfirm()` on click. Disabled when `isPending`.

  Import `AlertDialog`/`AlertDialogAction`/`AlertDialogCancel`/`AlertDialogContent`/`AlertDialogDescription`/`AlertDialogFooter`/`AlertDialogHeader`/`AlertDialogTitle` from `@/components/ui/alert-dialog`.

- [x] T013 [P] [US3] Create `src/components/admin/users/RoleChangeDialog.tsx` — a Shadcn `AlertDialog` for role change confirmation. Accept these props:
  ```ts
  interface RoleChangeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    username: string;
    targetRole: 'admin' | 'user'; // the role we are switching TO
    onConfirm: () => void;
    isPending: boolean;
  }
  ```
  Content:
  - `AlertDialogTitle`: `targetRole === 'admin' ? "Assign Admin Privileges" : "Revoke Admin Privileges"`
  - `AlertDialogDescription`:
    - If `targetRole === 'admin'`: "**{username}** will be granted admin privileges and will have full access to the admin dashboard."
    - If `targetRole === 'user'`: "**{username}** will have their admin privileges revoked and returned to a regular user account."
  - Cancel button: `AlertDialogCancel` — text "Cancel". Disabled when `isPending`.
  - Confirm button: `AlertDialogAction` — text `targetRole === 'admin' ? "Grant Admin" : "Revoke Admin"`. Show `Loader2` spinner when `isPending`. Disabled when `isPending`.

- [x] T014 [P] [US3] Create `src/components/admin/users/ResetPasswordDialog.tsx` — a Shadcn `AlertDialog` for password reset email confirmation. Accept these props:
  ```ts
  interface ResetPasswordDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    email: string;
    onConfirm: () => void;
    isPending: boolean;
  }
  ```
  Content:
  - `AlertDialogTitle`: "Send Password Reset Email"
  - `AlertDialogDescription`: "A password reset link will be sent to **{email}**. The user will receive an email to create a new password."
  - Cancel button: `AlertDialogCancel` — text "Cancel". Disabled when `isPending`.
  - Confirm button: `AlertDialogAction` — text "Send Reset Email". Show `Loader2` spinner when `isPending`. Disabled when `isPending`.

- [x] T015 [US3] Create `src/components/admin/users/UserActionButtons.tsx` — renders the three action buttons (Delete, Role Change, Reset Password) and owns the open-state for each dialog. Accept these props:
  ```ts
  interface UserActionButtonsProps {
    user: AdminUser;
    currentAdminId: string; // the logged-in admin's user ID
    onActionSuccess: () => void; // called after any successful mutation → closes the profile modal
  }
  ```

  **Internal state**:
  ```ts
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [roleChangeOpen, setRoleChangeOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  ```

  **Hooks**: call `useDeleteUserMutation`, `useRoleChangeMutation`, `useResetPasswordMutation` from `src/hooks/admin/useAdminUserMutations.ts`.

  **Target role logic**: `const targetRole = user.role === 'admin' ? 'user' : 'admin';`

  **Self-action guard**: `const isSelf = user.id === currentAdminId;`

  **Delete button**:
  - `variant="destructive"`, `size="sm"`, `Trash2` icon + text "Delete User"
  - `disabled={deleteOpen || isSelf}` (admins cannot delete themselves)
  - If `isSelf`, wrap in a `title="You cannot delete your own account"` tooltip via the `title` HTML attribute on the button

  **Role change button**:
  - `variant="outline"`, `size="sm"`, `ShieldCheck` or `ShieldOff` icon depending on `targetRole`
  - Text: `targetRole === 'admin' ? "Assign Admin" : "Revoke Admin"`
  - `disabled={roleChangeOpen || isSelf}` (cannot change own role)

  **Reset password button**:
  - `variant="ghost"`, `size="sm"`, `KeyRound` icon + text "Reset Password"
  - Always enabled (even for self)

  **Mutation handlers**:
  - Delete `onConfirm`: `deleteUserMutation.mutate(user.id, { onSuccess: () => { setDeleteOpen(false); onActionSuccess(); } })`
  - Role change `onConfirm`: `roleChangeMutation.mutate({ userId: user.id, role: targetRole }, { onSuccess: () => { setRoleChangeOpen(false); onActionSuccess(); } })`
  - Reset `onConfirm`: `resetPasswordMutation.mutate(user.email, { onSuccess: () => { setResetOpen(false); /* show success toast */ }, onError: () => { /* show error toast */ } })`

  **Error handling**: if any mutation `isError`, render a `<p className="text-sm text-destructive">` below the buttons with the error message. Use `(error as Error).message ?? 'An error occurred.'`.

  **Toast**: For success/error on reset password, use whatever toast mechanism exists in the project. Check `src/components/ui/` for a `Toaster` or `Toast` component. If there is a toast hook (e.g., `useToast`), use it. If not, a simple `<p>` state-driven message is acceptable.

  Render all three `AlertDialog` components beneath the buttons, controlled by the `open` state vars.

  **Layout**: `<div className="flex flex-wrap gap-2">` containing the three buttons, then the three dialogs.

  Import `Button` from `@/components/ui/button`. Import `Trash2`, `ShieldCheck`, `ShieldOff`, `KeyRound` from `lucide-react`.

- [x] T016 [US3] Update `src/components/admin/users/UserProfileModal.tsx` — integrate `UserActionButtons` into the `DialogFooter`. The `currentAdminId` prop must be passed down from the page. To get the current admin's ID, check if a Zustand auth store exists (`src/stores/` or `src/providers/`) that exposes the current user. If it does, read `currentAdminId` from there inside `UserProfileModal`. If no auth store exists, accept it as a prop: `currentAdminId: string`. In both cases pass it to `<UserActionButtons>`. The `onActionSuccess` callback should call `onClose()` so the modal closes after a successful delete or role change.

  Also update `dialogue/dialog open state` trigger: the `open` prop should be `open={!!userId && !isPending}` — keep showing modal while pending, but ensure it opens only when userId is set.

  **Important**: only add `UserActionButtons` to the `DialogFooter` after the account details and order history sections are confirmed rendering correctly (i.e., do not add this until T011 is complete).

- [x] T017 [US3] Update `src/app/(admin)/dashboard/users/page.tsx` — pass `currentAdminId` to `UserProfileModal` if it requires it as a prop (depending on how T016 was resolved). If the modal reads from a Zustand store internally, no page change is needed. Also verify the page still compiles after all dialog and action button components are added.

**Checkpoint — US3**: Open a user profile modal. Three action buttons are visible in the footer. Delete — confirm dialog fires → on confirm, user removed from list, modal closes. Role change — confirm dialog fires → on confirm, user role updates in list. Self-row action buttons are disabled.

---

## Phase 6: User Story 4 — Assign/Revoke Admin Privileges (Priority: P4)

**Goal**: Within the profile modal, admins can toggle a user's role between `admin` and `user`. This story is largely delivered by T013 and T015 already created in Phase 5. This phase only validates and wires any remaining gaps.

**Independent Test**: Open a user with role `user`. The "Assign Admin" button appears in the modal footer. Click it → `RoleChangeDialog` opens with correct description. Confirm → user's role badge updates in the list to "Admin". Open an admin user → "Revoke Admin" button appears. Opening own profile → role change button is disabled.

### Implementation for User Story 4

- [x] T018 [US4] Verify `UserActionButtons.tsx` (created in T015) correctly shows "Assign Admin" when `user.role !== 'admin'` and "Revoke Admin" when `user.role === 'admin'`. Verify `isSelf` logic disables the button for the current admin's own profile. Verify the `onSuccess` of `useRoleChangeMutation` invalidates both `['admin', 'users']` (refreshes list) and `['admin', 'user', userId]` (refreshes profile). If any of these are missing, fix them in `src/hooks/admin/useAdminUserMutations.ts` and `src/components/admin/users/UserActionButtons.tsx`.

- [x] T019 [US4] Verify `RoleChangeDialog.tsx` (created in T013) renders context-appropriate copy for both the assign and revoke scenarios. Open both an admin-role user and a regular-user profile in the browser and confirm the dialog title, description, and button label all change correctly based on `targetRole`.

**Checkpoint — US4**: Role change is fully functional. Both directions (assign / revoke) work. Self-demotion is blocked in the UI. List refreshes after role change.

---

## Phase 7: User Story 5 — Send Password Reset Email (Priority: P5)

**Goal**: An admin can trigger a password reset email to be sent to a user's registered email address via the profile modal, with confirmation before dispatch. OAuth users receive an appropriate error message.

**Independent Test**: Open any user's profile modal. Click "Reset Password". `ResetPasswordDialog` opens showing the user's email address. Click Cancel → nothing happens. Click "Send Reset Email" → button shows loading spinner → on success, dialog closes and a success message appears. For an OAuth user (provider ≠ 'email'), the backend returns an error → an error message appears in the modal footer.

### Implementation for User Story 5

- [x] T020 [US5] Verify `useResetPasswordMutation` in `src/hooks/admin/useAdminUserMutations.ts` correctly calls `authService.forgotPassword({ email })` — not any `userService` method. Double-check the import: `import { authService } from '@/services/auth.service'`. Confirm `ForgotPasswordRequest` is `{ email: string }` (check `src/types/auth.ts` line 32–34). Run `npx tsc --noEmit` from the project root to verify zero TypeScript errors.

- [x] T021 [US5] Verify `ResetPasswordDialog.tsx` (created in T014) shows the correct `email` value in the description. Verify the "Send Reset Email" button is not disabled initially (only disabled while `isPending`). Confirm the dialog `onOpenChange` calls `onOpenChange(false)` on the cancel action.

- [x] T022 [US5] Verify `UserActionButtons.tsx` handles the reset password `onError` case by displaying a visible error message. The error from `authService.forgotPassword` for an OAuth user will be an Axios error — extract the human-readable message with: `(error as AxiosError<{ detail?: string; message?: string }>).response?.data?.detail ?? (error as Error).message ?? 'Failed to send reset email.'`. Display this in a `<p className="text-sm text-destructive mt-2">` beneath the buttons.

**Checkpoint — US5**: Reset password flow is fully functional. Success case shows confirmation. Error case (OAuth users) shows human-readable message. No silent failures.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, responsiveness, and zero-error build.

- [x] T023 [P] Run `npx tsc --noEmit` from `c:\iProjects\gimxa` and resolve ALL TypeScript errors. Zero errors required before this task is marked complete. Common issues to watch: missing `AdminUser` imports, `RoleEnum` used without import, `UserListParams` boolean fields typed as `string` in URL param conversion.

- [x] T024 [P] Verify tablet responsiveness (768px viewport): `UserFilters` dropdowns wrap to a second row but do not overflow. `UserTable` columns are readable (use `overflow-x-auto` wrapper on the table if needed). `UserProfileModal` fits within the viewport with scroll on overflow content.

- [x] T025 Verify all loading states: (a) initial page load shows skeleton rows, (b) search/filter change shows skeleton briefly before results, (c) all three action buttons show `Loader2` spinner while their respective mutations are pending, (d) profile modal shows skeletons while profile data loads.

- [x] T026 Verify all empty states: (a) "No users found" displays when search/filter returns zero results, (b) "No orders yet" displays in profile modal for users with zero orders, (c) empty state icon and text are visually clear and centered.

- [x] T027 Verify all error states: (a) user list shows error message if `useAdminUsersQuery` fails, (b) profile modal shows error if `useAdminUserProfileQuery` fails, (c) delete failure shows error in `UserActionButtons`, (d) role change failure shows error in `UserActionButtons`, (e) reset password failure shows error with extracted backend message. No raw JSON or stack traces visible in the UI.

- [x] T028 Verify URL state preservation: (a) apply a search + filter, open a profile modal, close it — search and filter values are still in the URL and list remains filtered, (b) navigate to page 3, open a profile, close it — still on page 3.

- [x] T029 Verify cache-clear hook fires on every mutation: temporarily add a `console.log('cache cleared')` inside `useCacheClear.ts`, perform a delete, role change, and password reset — confirm the log appears three separate times. Remove the log after verification.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately. T001 and T002 can run in parallel.
- **Phase 2 (Foundational)**: Depends on T001 and T002. T003, T004, T005 can run in parallel once T001+T002 are done.
- **Phase 3 (US1)**: Depends on all of Phase 2. T006 and T007 can run in parallel, T008 can run in parallel with them. T009 depends on T006+T008. T010 depends on T007+T009.
- **Phase 4 (US2)**: T011 depends on Phase 2 + T006 (UserRoleBadge). Can start after Phase 2 independently of Phase 3 (different files).
- **Phase 5 (US3)**: T012, T013, T014 can run in parallel (different files). T015 depends on T012+T013+T014+Phase 2. T016 depends on T011+T015. T017 depends on T016.
- **Phase 6 (US4)**: T018, T019 are verification tasks — depend on T015 and T013 respectively.
- **Phase 7 (US5)**: T020, T021, T022 are verification tasks — depend on T005, T014, T015 respectively.
- **Phase 8 (Polish)**: Depends on all phases complete. T023 and T024 can run in parallel.

### User Story Dependencies

| Story | Blocking dependency | Can start after |
|---|---|---|
| US1 | Phase 2 complete | T003, T004, T005 done |
| US2 | Phase 2 complete | T003, T004 done; T006 done |
| US3 | US2 complete | T011 done (modal host exists) |
| US4 | US3 complete | T015 done (buttons exist) |
| US5 | US3 complete | T015 done (buttons exist) |

### Parallel Opportunities

```
Phase 1:  T001 ║ T002
Phase 2:  T003 ║ T004 ║ T005
Phase 3:  T006 ║ T007 ║ T008 → T009 → T010
Phase 4:  T011 (independently, alongside Phase 3)
Phase 5:  T012 ║ T013 ║ T014 → T015 → T016 → T017
Phase 8:  T023 ║ T024
```

---

## Implementation Strategy

### MVP (User Story 1 only)

1. Complete Phase 1 (T001, T002)
2. Complete Phase 2 (T003, T004, T005)
3. Complete Phase 3 (T006–T010)
4. ✅ **STOP and VALIDATE**: User list with search, filters, and pagination works independently
5. Deploy/demo: admins can search and find any user

### Incremental Delivery

1. **MVP** — list + filters works → Phase 1 + 2 + 3
2. **Profile view** → add Phase 4 (T011)
3. **Admin actions** → add Phase 5 (T012–T017) + Phase 6 (T018–T019) + Phase 7 (T020–T022)
4. **Polish** → Phase 8

---

## Notes

- `[P]` tasks touch different files — safe to implement in parallel
- Every `useMutation` `onSuccess` MUST follow the 2-step cache-clear pattern without exception
- The `UserListParams.is_active` and `UserListParams.is_verified` are `boolean | undefined` — convert from URL string with `value === 'true'`
- `RoleEnum` includes `'seller'` and `'developer'` — don't hardcode only `'admin'`/`'user'`
- Reference the orders page implementation for all debounce, URL param, and pagination patterns before writing anything from scratch
- Run `npx tsc --noEmit` after completing each phase to catch type errors early
