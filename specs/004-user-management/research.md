# Research: User Management (Admin) — Phase 0

**Feature**: `004-user-management`  
**Date**: 2026-04-18

---

## 1. Debounced Search Pattern

**Decision**: Use `useEffect` + `setTimeout` / `clearTimeout` with a 400ms delay, synced to URL search params via `useSearchParams` + `router.push` — identical to the Orders module (`orders/page.tsx` lines 84–92).

**Rationale**: The Orders page already has a proven, in-project implementation of this exact pattern. Reusing it ensures consistency, avoids introducing a third-party debounce library, and keeps the URL shareable/bookmarkable (browser Back/Forward navigation preserves state).

**Alternatives considered**:
- `useDeferredValue` (React 18) — not used elsewhere in the project; no benefit over the existing `setTimeout` pattern.
- `lodash.debounce` — adds a dependency for something already solved natively.

---

## 2. Filter State Management (role, is_active, provider, is_verified)

**Decision**: Encode all filter values as URL query string parameters via `useSearchParams`, mirroring the orders tab/status pattern. Each filter maps to a dedicated param key (`role`, `is_active`, `provider`, `is_verified`). Clearing a filter deletes the corresponding param.

**Rationale**: URL-driven state is the established pattern for admin list views. It makes filters bookmarkable and survives page refreshes. The `updateParams` helper from the Orders page is directly reusable.

**Alternatives considered**:
- Zustand filter store — rejected; the constitution specifies Zustand is for transient UI state only (modal open/close). Filter state is navigational state that belongs in the URL.

---

## 3. Profile Modal Pattern

**Decision**: Use Shadcn `Dialog` component (already installed) for the user profile modal. Modal open/close state is managed via a `selectedUserId: string | null` local `useState` in the page component — same pattern used by `OrderDetailsModal`.

**Rationale**: Shadcn `Dialog` is the project-standard modal primitive. The Orders page (`setSelectedOrderId`) demonstrates exactly how to wire a modal to a list row click, manage open state, and ensure the list stays mounted and stateful behind the modal.

**Alternatives considered**:
- Zustand modal store — valid per the constitution, but the Orders pattern uses local `useState` for single-modal-per-page cases and is simpler. Zustand is reserved for shared/cross-component modal state.

---

## 4. Admin Actions (Delete, Role Change, Password Reset) — Confirmation Pattern

**Decision**: Wrap each destructive action in Shadcn `AlertDialog` (already installed — the `npx shadcn add alert-dialog` command is running in the shell). Each action button triggers an `AlertDialog` with explicit confirmation before firing the `useMutation`.

**Rationale**: `AlertDialog` is the Shadcn-recommended component for irreversible actions. It is already being installed in the project. The Orders module uses it for order status changes (per PLAN.md).

---

## 5. Query Key Strategy

**Decision**: Extend `adminQueryKeys` in `src/hooks/admin/queryKeys.ts` with:
```ts
users: (params: UserListParams) => ['admin', 'users', params] as const,
user:  (id: string)             => ['admin', 'user',  id]     as const,
```
`userProfile` and `userOrders` are fetched under the `user` key with sub-keys as needed.

**Rationale**: Consistent with the existing key factory. Namespaced under `['admin', 'users', ...]` to allow precise `invalidateQueries` targeting after mutations without over-broad invalidation.

---

## 6. Cache-Clear Hook After Mutations

**Decision**: Every `useMutation` `onSuccess` callback MUST call `useCacheClear` (`authService.clearCache()`) THEN `queryClient.invalidateQueries(['admin', 'users', ...])`. This is the mandatory 2-step pattern defined in the project constitution and PLAN.md.

**Rationale**: Non-negotiable project-wide rule. `useCacheClear` already exists at `src/hooks/admin/useCacheClear.ts`.

---

## 7. Password Reset Email — Service Method

**Decision**: Use the existing `authService.forgotPassword({ email: user.email })` from `src/services/auth.service.ts`. This posts to `POST /auth/forgot-password/` with `{ email }` and triggers the standard password reset email flow. **No new service method or backend endpoint is required.**

**Rationale**: `forgotPassword` is already implemented, typed (`ForgotPasswordRequest = { email: string }`), and hits the correct backend endpoint. The admin effectively initiates the same reset-email flow the user would trigger themselves — using the target user's `email` field from the `AdminUser` object. No changes to `user.service.ts` are needed.

**Alternatives considered**:
- Adding a new `adminResetUserPassword(userId)` to `userService` — rejected; the existing `authService.forgotPassword` already covers this exactly without any backend or service changes.

---

## 8. Existing `AdminUser` Type Coverage

**Decision**: The existing `AdminUser` type in `src/types/admin/users.ts` already covers all spec-required fields (id, username, email, full_name, role, is_active, provider, is_verified, date_joined, avatar). `RoleEnum` includes `'user' | 'admin' | 'seller' | 'developer'` — the spec's binary admin/user model maps cleanly to the `admin` and `user` variants. No new base types are required; only a `UserProfileResponse` type for the extended profile+orders view needs to be added.

---

## 9. Component Architecture Decision

**Decision**: Feature components live under `src/components/admin/users/`. The page at `src/app/(admin)/dashboard/users/page.tsx` acts as the orchestrator only; it holds no business logic directly.

**Sub-components**:
- `UserTable` — the data table with skeleton states
- `UserFilters` — search input + filter dropdowns
- `UserTableRow` — individual row component
- `UserProfileModal` — profile + order history modal
- `UserActionButtons` — delete / role change / reset buttons within modal
- `UserRoleBadge` — role display badge (shared with table)
- `DeleteUserDialog` — `AlertDialog` wrapper for deletion confirmation
- `RoleChangeDialog` — `AlertDialog` wrapper for role change confirmation
- `ResetPasswordDialog` — `AlertDialog` wrapper for reset email confirmation

**Rationale**: Constitution Principle V mandates no megacomponents. Each component has one responsibility. The Orders module (single-file 287-line page) is a simpler case; the Users module has more interactivity and warrants decomposition.

---

## 10. Routing / Page Structure

**Decision**: Single page at `/dashboard/users` (existing route at `src/app/(admin)/dashboard/users/page.tsx`). No sub-routes. The profile modal and all action dialogs are overlays. The URL encodes: `search`, `role`, `is_active`, `provider`, `is_verified`, `page` as query params.

**Rationale**: The spec explicitly chose modal (not separate page) for the profile view. URL-based query params handle all stateful navigation needs without requiring additional routes.
