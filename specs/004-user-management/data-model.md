# Data Model: User Management (Admin)

**Feature**: `004-user-management`  
**Date**: 2026-04-18

---

## Entities

### 1. `AdminUser` *(existing — `src/types/admin/users.ts`)*

Represents a registered user as returned by the admin list endpoint.

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | UUID — primary key |
| `username` | `string` | Unique login handle |
| `email` | `string` | Unique; used for password reset email dispatch |
| `full_name` | `string \| null` | Display name |
| `role` | `RoleEnum` | `'user' \| 'admin' \| 'seller' \| 'developer'` |
| `avatar` | `string \| null` | URL to profile image |
| `is_verified` | `boolean` | Email verification status |
| `provider` | `ProviderEnum` | `'email' \| 'google' \| 'facebook' \| string` |
| `last_login` | `string \| null` | ISO 8601 datetime |
| `date_joined` | `string` | ISO 8601 datetime |
| `last_updated` | `string` | ISO 8601 datetime |
| `is_active` | `boolean` | Account enabled / disabled |
| `is_staff` | `boolean` | Django staff flag |
| `is_superuser` | `boolean` | Django superuser flag |
| `is_hidden` | `boolean` | Hidden from public listing |

**No mutations to this type.** It is read-only from the list/detail endpoints.

---

### 2. `UserProfileResponse` *(new — add to `src/types/admin/users.ts`)*

Extended user detail including linked order history, returned by `getUserProfile(userId)`.

| Field | Type | Notes |
|---|---|---|
| `user` | `AdminUser` | Full user account details |
| `orders` | `UserOrderSummary[]` | Chronological order history |

---

### 3. `UserOrderSummary` *(new — add to `src/types/admin/users.ts`)*

A summarised order record as displayed in the user's profile modal.

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Order UUID |
| `order_number` | `string` | Human-readable reference (e.g., `ORD-001234`) |
| `created_at` | `string` | ISO 8601 datetime |
| `status` | `OrderStatus` | Reuse `OrderStatus` type from `src/types/admin/orders.ts` |
| `total_price` | `string` | Decimal string (backend authoritative) |
| `items_count` | `number` | Number of line items |

---

### 4. `UserListParams` *(existing — extend `src/types/admin/users.ts`)*

Query parameters for the admin user list endpoint.

| Field | Type | Notes |
|---|---|---|
| `search` | `string?` | Matches username, email, full_name, id |
| `role` | `string?` | Filter by role value |
| `is_active` | `boolean?` | Filter by active status |
| `provider` | `string?` | Filter by auth provider |
| `is_verified` | `boolean?` | Filter by verification state |
| `page` | `number?` | 1-indexed page number |
| `page_size` | `number?` | Default: 10 |

---

### 5. `AdminUpdateUserPayload` *(existing — no changes needed)*

Used for role change via `adminUpdateUser`. The `role` field covers the assign/revoke admin action.

---

### 6. `AdminResetPasswordPayload` *(new — add to `src/types/admin/users.ts`)*

Payload for the password reset email dispatch endpoint.

| Field | Type | Notes |
|---|---|---|
| `user_id` | `string` | Target user UUID |

> **Note**: Depending on the backend endpoint signature, this may be a path param only (no request body). To be confirmed during implementation against the running backend. If the endpoint is `POST /users/admin/users/{id}/reset-password/` with no body, this type may be omitted.

---

## State Transitions

### User Active Status (`is_active`)
```
active (is_active: true)  ←→  deactivated (is_active: false)
```
Toggled via `adminUpdateUser` PATCH with `{ is_active: false/true }`.
> **Out of scope for v1**: The spec does not include activate/deactivate as an explicit admin action. Only role change, delete, and password reset are in scope.

### User Role (`role`)
```
'user' (regular)  ←→  'admin'
```
Toggled via `adminUpdateUser` PATCH with `{ role: 'admin' }` or `{ role: 'user' }`.
Self-demotion is prevented by the frontend (action hidden/disabled for the current admin's own profile).

---

## Query Key Registry Extension

Add to `src/hooks/admin/queryKeys.ts`:

```typescript
import type { UserListParams } from '@/types/admin/users';

// Within adminQueryKeys object:
users: (params: UserListParams) => ['admin', 'users', params] as const,
user:  (id: string)             => ['admin', 'user',  id]     as const,
```

---

## Validation Rules

| Rule | Enforcement |
|---|---|
| Self-delete blocked | Backend rejects; frontend disables/hides action for current admin |
| Self-demotion blocked | Frontend disables "Revoke Admin" when `user.id === currentAdminId` |
| OAuth reset-password rejection | Backend returns error; frontend displays human-readable message |
| Role values constrained to `RoleEnum` | TypeScript + Zod schema on response |
| Pagination page size = 10 | Hardcoded `PAGE_SIZE = 10` constant in page component |
