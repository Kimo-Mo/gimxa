# API Contracts: Coupon Management (Phase 5)

**Generated**: 2026-04-20  
**Type**: Internal REST API contracts (Django backend ↔ Next.js admin frontend)

---

## Endpoints Consumed

All endpoints are prefixed with the base API URL configured in the `api` Axios instance.

---

### GET `/coupons/admin/all/`

**Purpose**: Retrieve all coupons for the admin list page.  
**Auth**: Required (admin JWT)  
**Method**: `adminCouponsList()`

**Response** (array):
```typescript
AdminCoupon[]
// AdminCoupon shape: see data-model.md
```

---

### POST `/coupons/admin/all/`

**Purpose**: Create a new coupon.  
**Auth**: Required (admin JWT)  
**Method**: `adminAddCoupon(payload: AdminCouponPayload)`

**Request body**:
```typescript
{
  code: string;               // Required, uppercase alphanumeric
  scope: ScopeType;           // Required
  discount_type: DiscountType; // Required
  discount_value: number;     // Required, positive
  start_at: string;           // Required, ISO datetime
  end_at: string;             // Required, ISO datetime, > start_at
  max_usage?: number;         // Optional, positive integer
  is_active?: boolean;        // Optional, default true
}
```

**Success response**: `201 Created` → `AdminCoupon`  
**Error responses**:
- `400 Bad Request` → field validation errors (e.g., duplicate code)
- `401 Unauthorized`

---

### GET `/coupons/admin/coupon/{id}/`

**Purpose**: Get a single coupon's full detail for the edit page.  
**Auth**: Required (admin JWT)  
**Method**: `adminGetCouponDetail(id: string | number)`

**Response**: `AdminCoupon`

---

### PUT `/coupons/admin/coupon/{id}/`

**Purpose**: Update an existing coupon (all fields except `code`).  
**Auth**: Required (admin JWT)  
**Method**: `adminUpdateCoupon(id, payload: AdminCouponPayload)`

**Request body**: Same shape as create payload (backend ignores `code` changes).  
**Success response**: `200 OK` → `AdminCoupon`

---

### DELETE `/coupons/admin/coupon/{id}/`

**Purpose**: Permanently delete a coupon.  
**Auth**: Required (admin JWT)  
**Method**: `adminDeleteCoupon(id: string | number)` *(to be added to coupon.service.ts)*

**Success response**: `204 No Content` or `200 OK`  
**Error responses**:
- `404 Not Found` — coupon does not exist
- `401 Unauthorized`

---

### GET `/coupons/admin/coupon/{id}/usages/`

**Purpose**: Retrieve all redemption records for a specific coupon.  
**Auth**: Required (admin JWT)  
**Method**: `adminCouponUsages(id: string | number)`

**Response** (array):
```typescript
AdminCouponUsage[]
// { id: number; user: string; order: string; used_at: string; }
```

---

### POST `/coupons/admin/coupon/{id}/products/`

**Purpose**: Attach one or more products to a coupon's scope.  
**Method**: `adminAddProductsToCoupon(id, { resource_ids: string[] })`

**Request body**: `{ resource_ids: string[] }`  
**Success**: `200 OK` or `201 Created`

---

### DELETE `/coupons/admin/coupon/{id}/products/{productId}/`

**Purpose**: Remove a specific product from a coupon's scope.  
**Method**: `adminDeleteProductFromCoupon(id, productId)`

**Success**: `204 No Content` or `200 OK`

---

### POST `/coupons/admin/coupon/{id}/categories/`

**Purpose**: Attach one or more categories to a coupon's scope.  
**Method**: `adminAddCategoryToCoupon(id, { resource_ids: string[] })`

---

### DELETE `/coupons/admin/coupon/{id}/categories/{categoryId}/`

**Purpose**: Remove a specific category from a coupon's scope.  
**Method**: `adminDeleteCategoryFromCoupon(id, categoryId)`

---

### POST `/coupons/admin/coupon/{id}/packages/`

**Purpose**: Attach one or more top-up packages to a coupon's scope.  
**Method**: `adminAddPackageToCoupon(id, { resource_ids: string[] })`

---

### DELETE `/coupons/admin/coupon/{id}/packages/{packageId}/`

**Purpose**: Remove a specific package from a coupon's scope.  
**Method**: `adminDeletePackageFromCoupon(id, packageId)`

---

## External Data Sources (Resource Picker)

| Picker | Endpoint | Service |
|--------|----------|---------|
| Product picker | `GET /catalog/admin/products` | `catalogService.adminProductsList()` |
| Category picker | `GET /catalog/admin/categories/` | `catalogService.adminCategoriesList()` |
| Package picker | `GET /topup/admin/topups/{slug}/packages/` | `topupService.adminPackagesList(slug)` |

> **Note**: Package picker first needs topup list via `GET /topup/admin/topups` → `topupService.adminTopupsList()` to get topup slugs, then fetches packages per topup.

---

## Mutation + Cache Pattern (All Endpoints)

Every mutation `onSuccess` MUST execute:
1. `await authService.clearCache()` — clears Django backend cache
2. `queryClient.invalidateQueries({ queryKey: [...] })` — refreshes React Query cache

See `data-model.md` → "API Surface (Write)" for per-mutation invalidation targets.
