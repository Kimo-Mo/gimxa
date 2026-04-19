# API Contracts: User Management (Admin)

**Feature**: `004-user-management`  
**Date**: 2026-04-18  
**Service layer**: `src/services/user.service.ts`

All endpoints go through the project's configured `api` Axios instance with pre-configured JWT interceptors.

---

## Existing Endpoints (used as-is)

### `GET /users/admin/users`
**Service method**: `userService.adminUsersList(params?: UserListParams)`

**Query parameters**:
| Param | Type | Description |
|---|---|---|
| `search` | `string` | Searches username, email, full_name, id |
| `role` | `string` | Filter by role (`user`, `admin`, `seller`, `developer`) |
| `is_active` | `boolean` | Filter by active status |
| `provider` | `string` | Filter by auth provider (`email`, `google`, `facebook`) |
| `is_verified` | `boolean` | Filter by email verification state |
| `page` | `number` | 1-indexed page number |
| `page_size` | `number` | Records per page (default: 10) |

**Response shape** (paginated):
```typescript
{
  count: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
  results: AdminUser[];
}
```

---

### `GET /users/user/{userId}/profile`
**Service method**: `userService.getUserProfile(userId: string)`

**Response shape**:
```typescript
{
  // Profile-level user data + order history
  // Exact shape to be confirmed against backend during implementation.
  // Expected to include AdminUser fields + orders array.
  user: AdminUser;
  orders: UserOrderSummary[];
}
```

---

### `PATCH /users/user/{userId}/profile/update/`
**Service method**: `userService.adminUpdateUser(userId: string, payload: AdminUpdateUserPayload)`

**Request payload** (role change):
```typescript
{ role: 'admin' | 'user' }
```

**Response**: Updated `AdminUser` object.

**Used for**: Assign admin / Revoke admin actions.

---

### `DELETE /users/admin/users/{userId}/`
**Service method**: `userService.adminDeleteUser(userId: string)`

**Response**: `204 No Content` on success.

**Error cases**:
- `403 Forbidden` — admin attempting to delete own account (backend-enforced).
- `404 Not Found` — user not found.

---

## Password Reset (Existing Endpoint — no new method required)

### `POST /auth/forgot-password/`
**Service method**: `authService.forgotPassword(data: ForgotPasswordRequest)` — **already exists in `auth.service.ts`**

**Request payload**:
```typescript
// ForgotPasswordRequest
{ email: string } // Pass the target AdminUser's email field
```

**How it is invoked by the admin**:
The `useResetPasswordMutation` calls `authService.forgotPassword({ email: user.email })` where `user` is the currently displayed `AdminUser` in the profile modal.

**Response on success**: `void` (204 / empty body).

**Error cases**:
- `400 Bad Request` — user registered via OAuth (no local password); backend returns descriptive error message, surfaced as a toast.
- `404 Not Found` — email not found in the system.

> **No changes to `user.service.ts` are required for password reset.**

---

## Cache Invalidation Contract

After every successful mutation, the following sequence MUST execute (constitution-mandated):

```typescript
// 1. Clear Django backend cache
await cacheClear(); // useCacheClear()

// 2. Invalidate React Query cache
queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
// Also invalidate specific user if profile was fetched:
queryClient.invalidateQueries({ queryKey: ['admin', 'user', userId] });
```

---

## Hook Query Keys

```typescript
// queryKeys.ts additions
users: (params: UserListParams) => ['admin', 'users', params] as const,
user:  (id: string)             => ['admin', 'user',  id]     as const,
```
