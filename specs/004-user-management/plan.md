# Implementation Plan: User Management (Admin)

**Branch**: `004-user-management` | **Date**: 2026-04-18 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/004-user-management/spec.md`

---

## Summary

Build the Admin User Management module: a paginated, debounce-searchable, filterable user list at `/dashboard/users`, a modal profile view with order history, and three admin actions (delete, role change, password reset email) each gated behind an `AlertDialog` confirmation. The implementation follows the established Orders module pattern: URL-driven state, React Query for all data, the mandatory 2-step cache-clear hook on every mutation, and strict feature-first component decomposition.

---

## Technical Context

**Language/Version**: TypeScript 5 / Next.js 15 (App Router)  
**Primary Dependencies**: TanStack React Query v5, Shadcn UI (Dialog, AlertDialog, Table, Badge, Input, Button, Select, Skeleton), Axios `api` instance, Zustand (modal open/close state only if cross-component; local `useState` for single-page modal pattern)  
**Storage**: N/A — all state is server-side (Django backend) or React Query cache  
**Testing**: TypeScript compiler (`tsc --noEmit`) — zero errors gate before merge  
**Target Platform**: Web (tablet 768px → desktop 1920px); no mobile requirement for v1  
**Project Type**: Web application — Next.js Admin Dashboard  
**Performance Goals**: List loads in < 2s; debounced search updates in < 1s after pause  
**Constraints**: PAGE_SIZE = 10 (hardcoded constant); no inline `style` props; no `any` types; no raw `fetch`; no `useEffect`/`useState` for data fetching  
**Technical Context** field correction: `user.service.ts` requires no new methods. Password reset is handled by the pre-existing `authService.forgotPassword({ email })` from `auth.service.ts`.

**Scale/Scope**: Single `/dashboard/users` page; ~9 new component files; ~3 new hook files; 2 type additions; **0 new service methods**.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Gate | Status |
|---|------|--------|
| 1 | **Output Discipline** — No large code blocks in chat; all changes go directly to files with 2–3 sentence summaries | ✅ |
| 2 | **TypeScript Strictness** — All props, state, and payloads typed; zero `any` usage; Zod schemas for API responses | ✅ |
| 3 | **React Query** — All fetches use `useQuery`; all mutations use `useMutation` + `queryClient.invalidateQueries` on success | ✅ |
| 4 | **Zustand Scope** — Stores cover client-only transient state only; no server data stored in Zustand | ✅ (local `useState` for modal; no Zustand needed) |
| 5 | **Componentization** — No single-file megacomponents; features colocated under `src/components/admin/users/` | ✅ |
| 6 | **Axios Instance** — All HTTP calls go through the configured `api` instance; no raw fetch or parallel refresh logic | ✅ |
| 7 | **Graceful Degradation** — Every query/mutation handles `isPending`, `isError`, and empty states; no raw errors shown to users | ✅ |
| 8 | **Data Integrity** — Pricing, permissions, and statuses sourced from backend responses only; no client-side recalculation | ✅ |
| 9 | **Tailwind Only** — No inline `style` props or external CSS files outside global reset; fully responsive (Tablet/Desktop) | ✅ |

**All gates pass. No complexity violations.**

---

## Project Structure

### Documentation (this feature)

```text
specs/004-user-management/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── contracts/
│   └── api.md           ← Phase 1 output
└── tasks.md             ← Phase 2 output (created by /speckit-tasks)
```

### Source Code (this feature)

```text
src/
├── app/
│   └── (admin)/dashboard/users/
│       └── page.tsx                        ← MODIFY (currently stub; replace with full implementation)
│
├── components/admin/users/                 ← CREATE (new directory)
│   ├── UserTable.tsx                       ← Paginated data table with skeleton states
│   ├── UserTableRow.tsx                    ← Single row; click opens profile modal
│   ├── UserFilters.tsx                     ← Search input + role/is_active/provider/is_verified dropdowns
│   ├── UserRoleBadge.tsx                   ← Role display badge (used in table + modal)
│   ├── UserProfileModal.tsx                ← Shadcn Dialog: account details + order history + action buttons
│   ├── UserActionButtons.tsx               ← Delete / Role Change / Reset Password buttons within modal
│   ├── DeleteUserDialog.tsx                ← AlertDialog: irreversible delete confirmation
│   ├── RoleChangeDialog.tsx                ← AlertDialog: assign/revoke admin confirmation
│   └── ResetPasswordDialog.tsx             ← AlertDialog: reset email confirmation
│
├── hooks/admin/
│   ├── queryKeys.ts                        ← MODIFY: add `users` and `user` keys
│   ├── useAdminUsersQuery.ts               ← CREATE: useQuery for paginated user list
│   ├── useAdminUserProfileQuery.ts         ← CREATE: useQuery for single user profile + orders
│   └── useAdminUserMutations.ts            ← CREATE: useMutation for delete, role change, reset password
│
├── services/
│   └── user.service.ts                     ← NO CHANGE needed (password reset uses authService.forgotPassword)
│
└── types/admin/
    └── users.ts                            ← MODIFY: add UserProfileResponse, UserOrderSummary types
```

**Structure Decision**: Single Next.js App Router page (no sub-routes). All interactivity is modal/dialog overlays. URL encodes all list state (`search`, `role`, `is_active`, `provider`, `is_verified`, `page`). Feature components colocated under `src/components/admin/users/` per constitution Principle V.

---

## Implementation Sequence

### Step 1 — Types & Service Layer
1. Extend `src/types/admin/users.ts` with `UserProfileResponse` and `UserOrderSummary`.
2. Extend `src/hooks/admin/queryKeys.ts` with `users` and `user` keys.
   *(No changes to `user.service.ts` or `auth.service.ts` — `authService.forgotPassword` is used as-is for password reset.)*

### Step 2 — Query & Mutation Hooks
4. Create `useAdminUsersQuery.ts` — `useQuery` wrapping `userService.adminUsersList(params)`.
5. Create `useAdminUserProfileQuery.ts` — `useQuery` wrapping `userService.getUserProfile(userId)`, enabled only when `userId` is non-null.
6. Create `useAdminUserMutations.ts` — three `useMutation` hooks:
   - `useDeleteUserMutation` → `userService.adminDeleteUser(userId)`
   - `useRoleChangeMutation` → `userService.adminUpdateUser(userId, { role })`
   - `useResetPasswordMutation` → `authService.forgotPassword({ email: user.email })` *(uses existing auth service — no new method)*
   Each `onSuccess`: `cacheClear()` → `queryClient.invalidateQueries`.

### Step 3 — Shared UI Components
7. Create `UserRoleBadge.tsx` — displays role as a styled badge.
8. Create `UserFilters.tsx` — search input (debounced via URL param) + four filter Select dropdowns.

### Step 4 — Confirmation Dialogs
9. Create `DeleteUserDialog.tsx` — Shadcn `AlertDialog` with irreversible-action warning copy.
10. Create `RoleChangeDialog.tsx` — Shadcn `AlertDialog` with role-specific copy (assign vs. revoke).
11. Create `ResetPasswordDialog.tsx` — Shadcn `AlertDialog` confirming email dispatch.

### Step 5 — Profile Modal
12. Create `UserActionButtons.tsx` — renders Delete, Role Change, Reset Password buttons; disables role change when `user.id === currentAdminId`.
13. Create `UserProfileModal.tsx` — Shadcn `Dialog` showing account details tab + order history list + `UserActionButtons`. Uses `useAdminUserProfileQuery` (enabled when modal is open).

### Step 6 — Table Components
14. Create `UserTableRow.tsx` — single row rendering `AdminUser` data with `UserRoleBadge`; `onClick` sets `selectedUserId`.
15. Create `UserTable.tsx` — renders table header, skeleton rows (loading), empty state, and `UserTableRow` list. Includes pagination controls.

### Step 7 — Page Orchestration
16. Replace `src/app/(admin)/dashboard/users/page.tsx` with full implementation: URL param management (`useSearchParams`/`router.push`), debounce effect, `useAdminUsersQuery`, `UserFilters`, `UserTable`, `UserProfileModal`.

### Step 8 — Validation
17. Run `npx tsc --noEmit` — zero errors required.
18. Manually verify: list loads, search debounces, filters apply, modal opens/closes, all three actions complete with confirmation dialogs, errors surface as toast messages. Cache-clear runs on every mutation `onSuccess`.

---

## Key Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| Profile view UX | Modal dialog | Spec clarification Q1; keeps list in context |
| Search trigger | Debounced live (400ms) | Spec clarification Q4; matches Orders module pattern |
| Role change entrypoint | Profile modal only | Spec clarification Q3; prevents accidental inline changes |
| Password reset type | Email dispatch | Spec clarification Q2; secure, backend-initiated |
| Page size | 10 | Spec clarification Q5; matches Orders module |
| Filter state storage | URL query params | Constitution Principle IV; Zustand forbidden for nav state |
| Modal state | Local `useState` | Orders pattern; Zustand overkill for single-page modal |
| Confirmation gate | Shadcn AlertDialog | Already installed; project standard for destructive actions |
