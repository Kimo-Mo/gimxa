# API Contracts: Products & Top-Up Management Refactor

**Feature**: `001-products-topups-refactor`
**Date**: 2026-04-15

All contracts below describe the existing backend API surface consumed by this
frontend phase. No new backend endpoints are introduced except `DELETE /catalog/admin/tags/{id}/`
(see C-07 — confirm with backend team before implementing FR-P11).

---

## C-01 — Products List

**Method & URL**: `GET /catalog/admin/products`
**Service**: `catalogService.adminProductsList(params)`

**Query Params**:

| Param | Type | Notes |
|-------|------|-------|
| `page` | `number` | 1-indexed; default 1 |
| `page_size` | `number` | Default 10 (`PAGE_SIZE` constant) |
| `search` | `string` | 400 ms debounced on the client |
| `category` | `string` | Category ID string |
| `product_type` | `string` | Exclude topups; exact value TBC at impl time (e.g. `'key'`); fallback: `is_topup: false` |

**Response** (`PaginatedResponse<Product>`):
```json
{
  "results": [Product],
  "count": 42,
  "total_pages": 5,
  "current_page": 1
}
```

**React Query key**: `['admin', 'products', { page, search, categoryId, product_type }]`
**staleTime**: `0` (default)

---

## C-02 — Product Detail

**Method & URL**: `GET /catalog/admin/products/{slug}`
**Service**: `catalogService.adminGetProduct(slug)`

**Response**: `Product` (full detail including `images`, `attributes`, `categories`, `tags`)
**React Query key**: `['admin', 'product', slug]`
**staleTime**: `0`

---

## C-03 — Create Product

**Method & URL**: `POST /dashboard/admin/products/create/`
**Service**: `dashboardService.adminCreateProductFull(formData)`
**Content-Type**: `multipart/form-data` (set automatically by Axios — do NOT set manually)

**FormData fields**:

| Field | Notes |
|-------|-------|
| `name` | Required |
| `product_type` | `'digital'` |
| `stock_mode` | `'automatic'` or `'manual'` |
| `region` | Default `'global'` |
| `price` | Positive decimal string, max 2dp |
| `manual_fulfillment_time` | Required if `manual`; omit if `automatic` |
| `short_description` | Optional |
| `description` | Optional |
| `is_active`, `is_available`, `is_popular`, `is_featured` | Boolean strings `'true'`/`'false'` |
| `category` | Category ID string |
| `tags` | Repeated field — one per selected tag ID |
| `images[N][image]` | File upload |
| `images[N][is_main]` | `'true'` for the main image |
| `attributes[N][name]`, `attributes[N][value]` | Key-value pairs |
| `codes` | JSON-stringified array of code strings (if `automatic`) |

**On success**: Navigate to `/dashboard/products` + cache-clear hook

---

## C-04 — Update Product

**Method & URL**: `PUT /dashboard/admin/products/{slug}/full-update/`
**Service**: `dashboardService.adminUpdateProductFull(slug, formData)`
**Content-Type**: `multipart/form-data`

**Additional FormData fields** (vs Create):

| Field | Notes |
|-------|-------|
| `images[N][id]` | Existing image ID (for updates) |
| `deleted_images` | JSON-stringified array of image IDs to remove |
| `attributes[N][id]` | Existing attribute ID (for updates) |
| `deleted_attributes` | JSON-stringified array of attribute IDs to remove |

**On success**: Invalidate `['admin', 'products']` + `['admin', 'product', slug]` + cache-clear hook

---

## C-05 — Delete Product / Top-Up

**Method & URL**: `DELETE /catalog/admin/products/{slug}/`
**Service**: `catalogService.adminDeleteProduct(slug)` — used for BOTH products and top-ups

**Response**: `boolean`
**On success**: Invalidate `['admin', 'products']` or `['admin', 'topups']` (context-dependent) + cache-clear hook

---

## C-06 — Top-Ups List

**Method & URL**: `GET /topup/admin/topups`
**Service**: `topupService.adminTopupsList(params)`

**Query Params**:

| Param | Type | Notes |
|-------|------|-------|
| `page` | `number` | 1-indexed |
| `page_size` | `number` | Default 10 |
| `search` | `string` | 400 ms debounced |

**Note**: Category filtering is **client-side** — no `category` param supported by this endpoint.

**Response**: `PaginatedResponse<AdminTopupGame>`
**React Query key**: `['admin', 'topups', { page, search }]`
**staleTime**: `0`

---

## C-07 — Tag CRUD

### List Tags

**Method & URL**: `GET /catalog/admin/tags`
**Service**: `catalogService.adminTagsList()`
**React Query key**: `['admin', 'tags']`
**staleTime**: `5 * 60 * 1000`

### Create Tag

**Method & URL**: `POST /catalog/admin/tags/`
**Service**: `catalogService.adminAddTag({ name: string })`
**On success**: `invalidateQueries(['admin', 'tags'])`

### Delete Tag *(NEW — confirm with backend)*

**Method & URL**: `DELETE /catalog/admin/tags/{id}/`
**Service**: `catalogService.adminDeleteTag(id: number)` ← **TO BE ADDED to catalog.service.ts**
**Expected response**: `204 No Content`
**On success**: `invalidateQueries(['admin', 'tags'])` + deselect from `selectedTags` state
**On error**: Toast — `"Failed to delete tag."` — do not invalidate

> ⚠ **Risk**: If this endpoint does not exist on the backend, FR-P11 is **BLOCKED**.
> Handle with `405 Method Not Allowed` error toast: `"Tag deletion is not supported yet."`.

---

## C-08 — Categories List

**Method & URL**: `GET /catalog/admin/categories/`
**Service**: `catalogService.adminCategoriesList()`
**React Query key**: `['admin', 'categories']`
**staleTime**: `Infinity`

Client-side split:
- Products pages: `categories.filter(c => !c.name.startsWith('Topup'))`
- Top-Ups pages: `categories.filter(c => c.name.startsWith('Topup'))`

---

## C-09 — Top-Up Detail & Packages

### Topup Detail
**GET** `/topup/admin/topups/{slug}` → `topupService.adminTopupDetail(slug)`
**React Query key**: `['admin', 'topup', slug]` | **staleTime**: `0`

### Packages List
**GET** `/topup/admin/topups/{slug}/packages/` → `topupService.adminPackagesList(slug)`
**React Query key**: `['admin', 'packages', slug]` | **staleTime**: `0`

---

## C-10 — Top-Up Write Operations

| Operation | Method & URL | Service |
|-----------|-------------|---------|
| Update Game Info (product-level) | `PUT /dashboard/admin/products/{slug}/full-update/` | `dashboardService.adminUpdateProductFull(slug, formData)` |
| Update Topup active status | `PUT /topup/admin/topups/{slug}/` | `topupService.adminUpdateTopup(slug, { is_active })` |
| Add Field | `POST /topup/admin/fields/` | `topupService.adminAddField(payload)` |
| Update Field | `PUT /topup/admin/fields/{fieldId}/` | `topupService.adminUpdateField(fieldId, payload)` |
| Delete Field | `DELETE /topup/admin/fields/{fieldId}/` | `topupService.adminDeleteField(fieldId)` |
| Add Package | `POST /topup/admin/packages/` | `topupService.adminAddPackage(formData)` |
| Update Package | `PUT /topup/admin/packages/{packageId}/` | `topupService.adminUpdatePackage(packageId, formData)` |
| Delete Package | `DELETE /topup/admin/packages/{packageId}/` | `topupService.adminDeletePackage(packageId)` |
| Attach Codes to Package | See `codeService.adminAddUpdateDeleteCodes` | Called in `onSuccess` same cycle as package save |

---

## C-11 — Cache-Clear Endpoint

**Method & URL**: `POST /auth/clear-cache/`
**Service**: `authService.clearCache()`

**Behaviour**: Must be called **before** `queryClient.invalidateQueries` in every `onSuccess`.
On failure: log error silently — **DO NOT throw** — proceed to `invalidateQueries` regardless.
