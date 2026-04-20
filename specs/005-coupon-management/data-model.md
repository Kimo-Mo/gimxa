# Data Model: Coupon Management (Phase 5)

**Generated**: 2026-04-20  
**Feature**: `specs/005-coupon-management/spec.md`

---

## Entities

### AdminCoupon

Primary entity representing a promotional discount campaign.

| Field | TypeScript Type | Source | Validation |
|-------|----------------|--------|-----------|
| `id` | `number` | API (read-only) | — |
| `code` | `string` | API / Create payload | Required; `/^[A-Z0-9_-]+$/`; max 50 chars; unique (enforced by backend) |
| `scope` | `ScopeType` | API / Create payload | Required; one of: `'global(order)'`, `'product'`, `'package'`, `'category'` |
| `discount_type` | `DiscountType` | API / Create payload | Required; `'percent'` or `'fixed'` |
| `discount_value` | `number` | API / Create payload | Required; > 0; if `discount_type='percent'` then ≤ 100 |
| `is_active` | `boolean` | API / Create & Update payload | Default `true` |
| `start_at` | `string` (ISO 8601) | API / Create & Update payload | Required; must be a valid datetime |
| `end_at` | `string` (ISO 8601) | API / Create & Update payload | Required; must be after `start_at` |
| `max_usage` | `number \| undefined` | API / Create & Update payload | Optional; positive integer if provided |
| `used_count` | `number \| undefined` | API (read-only) | — |
| `created_at` | `string \| undefined` | API (read-only) | — |

**Type aliases**:
```typescript
export type DiscountType = 'percent' | 'fixed';
export type ScopeType = 'global(order)' | 'product' | 'package' | 'category';
```

**Computed display status** (client-side only — NOT persisted):
```typescript
export type CouponDisplayStatus = 'active' | 'upcoming' | 'expired' | 'inactive';
```

Logic:
- `'expired'` → `end_at < now` (highest priority)
- `'upcoming'` → `start_at > now` (second priority)
- `'active'` → `is_active === true AND start_at ≤ now AND end_at ≥ now`
- `'inactive'` → `is_active === false` (and not expired, not upcoming)

---

### AdminCouponPayload

Write payload for create and update operations. Mirrors `AdminCoupon` minus read-only fields.

| Field | TypeScript Type | Required | Notes |
|-------|----------------|----------|-------|
| `code` | `string` | Create only | Read-only on update (UI disables; backend ignores or enforces) |
| `scope` | `ScopeType` | Yes | Can be changed on update |
| `discount_type` | `DiscountType` | Yes | — |
| `discount_value` | `number` | Yes | — |
| `start_at` | `string` | Yes | ISO datetime string |
| `end_at` | `string` | Yes | ISO datetime string |
| `max_usage` | `number \| undefined` | No | Omit for unlimited |
| `is_active` | `boolean \| undefined` | No | Default `true` |

---

### CouponUsage

Read-only entity representing a single customer redemption of a coupon.

| Field | TypeScript Type | Notes |
|-------|----------------|-------|
| `id` | `number` | — |
| `user` | `string` | User identifier (email or username) |
| `order` | `string` | Order reference |
| `used_at` | `string` | ISO datetime |

---

### CouponResource

Conceptual entity representing a resource (Product, Category, or Package) attached to a coupon's scope. Not a separate API response shape — resources are fetched from their own services and linked via the coupon scoping endpoints.

**Add payload** (shared across all resource types):
```typescript
export interface AdminAddResourceToCouponPayload {
  resource_ids: string[];  // Array for batch add
}
```

**Resource types and their data sources**:

| Scope Value | Resource Label | Data Source | Service Method |
|-------------|----------------|-------------|---------------|
| `'product'` | Product | `catalogService` | `adminProductsList()` |
| `'category'` | Category | `catalogService` | `adminCategoriesList()` |
| `'package'` | Top-Up Package | `topupService` | `adminPackagesList(topupSlug)` |

---

## Zod Schema

```typescript
// src/components/features/coupons/coupon-schema.ts

import { z } from 'zod';

export const SCOPE_OPTIONS = ['global(order)', 'product', 'package', 'category'] as const;
export const DISCOUNT_TYPE_OPTIONS = ['percent', 'fixed'] as const;

export const couponFormSchema = z.object({
  code: z
    .string()
    .min(1, 'Code is required')
    .max(50, 'Code must be 50 characters or fewer')
    .regex(/^[A-Z0-9_-]+$/, 'Code must be uppercase alphanumeric (A-Z, 0-9, _, -)'),
  scope: z.enum(SCOPE_OPTIONS, { required_error: 'Scope is required' }),
  discount_type: z.enum(DISCOUNT_TYPE_OPTIONS, { required_error: 'Discount type is required' }),
  discount_value: z
    .number({ required_error: 'Discount value is required' })
    .positive('Must be greater than 0'),
  start_at: z.string().datetime({ message: 'Start date must be a valid date/time' }),
  end_at: z.string().datetime({ message: 'End date must be a valid date/time' }),
  max_usage: z.number().int().positive('Must be a positive integer').optional(),
  is_active: z.boolean().default(true),
}).superRefine((data, ctx) => {
  // Cross-field: percent cap
  if (data.discount_type === 'percent' && data.discount_value > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_big,
      maximum: 100,
      type: 'number',
      inclusive: true,
      path: ['discount_value'],
      message: 'Percentage discount cannot exceed 100',
    });
  }
  // Cross-field: date ordering
  if (data.start_at && data.end_at && data.end_at <= data.start_at) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['end_at'],
      message: 'End date must be after start date',
    });
  }
});

export type CouponFormValues = z.infer<typeof couponFormSchema>;
```

---

## React Query Key Registry

```typescript
// Canonical query keys for this feature
export const couponKeys = {
  all: ['admin', 'coupons'] as const,
  detail: (id: number | string) => ['admin', 'coupons', id] as const,
  usages: (id: number | string) => ['admin', 'coupons', id, 'usages'] as const,
} as const;
```

---

## State Transitions

```
Coupon Lifecycle:
  Created (is_active=true, start_at > now)  →  [upcoming]
  Created (is_active=true, start_at ≤ now)  →  [active]
  Created (is_active=false)                  →  [inactive]
  
  [active]   --toggle off-->  [inactive]
  [inactive] --toggle on-->   [active]  (if start_at ≤ now)
  [inactive] --toggle on-->   [upcoming] (if start_at > now)
  [active]   --end_at passes--> [expired]  (computed client-side)
  [inactive] --end_at passes--> [expired]  (computed client-side)
  
  [any] --DELETE-->  removed from system
```

---

## API Surface (Read)

| Operation | Service Method | React Query Key | Hook |
|-----------|---------------|-----------------|------|
| List all coupons | `couponService.adminCouponsList()` | `['admin', 'coupons']` | `useQuery` |
| Get coupon detail | `couponService.adminGetCouponDetail(id)` | `['admin', 'coupons', id]` | `useQuery` |
| Get usage history | `couponService.adminCouponUsages(id)` | `['admin', 'coupons', id, 'usages']` | `useQuery` |
| List products (picker) | `catalogService.adminProductsList()` | `['admin', 'products']` | `useQuery` |
| List categories (picker) | `catalogService.adminCategoriesList()` | `['admin', 'categories']` | `useQuery` |
| List packages (picker) | `topupService.adminPackagesList(slug)` | `['admin', 'packages', slug]` | `useQuery` |

## API Surface (Write)

| Operation | Service Method | Invalidates |
|-----------|---------------|-------------|
| Create coupon | `couponService.adminAddCoupon(payload)` | `['admin', 'coupons']` |
| Update coupon | `couponService.adminUpdateCoupon(id, payload)` | `['admin', 'coupons']`, `['admin', 'coupons', id]` |
| Delete coupon | `couponService.adminDeleteCoupon(id)` *(to add)* | `['admin', 'coupons']` |
| Toggle is_active | `couponService.adminUpdateCoupon(id, { is_active: !current })` | `['admin', 'coupons']`, `['admin', 'coupons', id]` |
| Add product to scope | `couponService.adminAddProductsToCoupon(id, { resource_ids })` | `['admin', 'coupons', id]` |
| Remove product from scope | `couponService.adminDeleteProductFromCoupon(id, productId)` | `['admin', 'coupons', id]` |
| Add category to scope | `couponService.adminAddCategoryToCoupon(id, { resource_ids })` | `['admin', 'coupons', id]` |
| Remove category from scope | `couponService.adminDeleteCategoryFromCoupon(id, categoryId)` | `['admin', 'coupons', id]` |
| Add package to scope | `couponService.adminAddPackageToCoupon(id, { resource_ids })` | `['admin', 'coupons', id]` |
| Remove package from scope | `couponService.adminDeletePackageFromCoupon(id, packageId)` | `['admin', 'coupons', id]` |
