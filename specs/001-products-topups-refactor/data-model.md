# Data Model: Products & Top-Up Management Refactor

**Feature**: `001-products-topups-refactor`
**Date**: 2026-04-15
**Source**: spec.md entities + clarifications (Q1–Q4)

---

## Entities

### Product (non-top-up)

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `name` | `string` | ✅ | Non-empty string |
| `price` | `number` | ✅ | `> 0`, max 2 decimal places (e.g. `9.99`); `0`, negative, or `9.999` invalid |
| `stock_mode` | `'automatic' \| 'manual'` | ✅ | Must be one of the two values |
| `manual_fulfillment_time` | `number` | If `stock_mode = 'manual'` | Integer `> 0`; hidden when `automatic` |
| `short_description` | `string` | ❌ | Optional |
| `description` | `string` | ❌ | Optional |
| `is_active` | `boolean` | ✅ | Default `true` |
| `is_available` | `boolean` | ✅ | Default `true` |
| `is_popular` | `boolean` | ✅ | Default `false` |
| `is_featured` | `boolean` | ✅ | Default `false` |
| `region` | `string` | ✅ | Default `'global'` |
| `category` | `string` (ID) | ✅ | Single category; must be a non-topup category |
| `tags` | `number[]` (IDs) | ❌ | Multi-select; admin can create and delete tags inline |
| `images` | `ImageState[]` | ✅ on Create | At least 1 image required on Create; exactly 1 must be `is_main: true` |
| `attributes` | `AttributeRow[]` | ❌ | Key-value pairs; deletable with server ID tracking |
| `codes` | `string` (textarea) | ✅ on Create if `automatic` | Newline-delimited; submitted as JSON array. On Edit: appends to existing inventory |

**Submitted as**: `multipart/form-data` via `dashboardService.adminCreateProductFull` / `adminUpdateProductFull`

**`product_type` value**: All non-topup products; excluded from topups list via server filter.

---

### Top-Up Game

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `product.name` | `string` | ✅ | Non-empty |
| `product.category` | `string` (ID) | ✅ | Must be a topup category (name starts with `'Topup'`) |
| `product.region` | `string` | ✅ | Default `'global'` |
| `product.short_description` | `string` | ❌ | Optional |
| `product.is_active` | `boolean` | ✅ | Default `true` |
| `product.is_available` | `boolean` | ✅ | Default `true` |
| `product.is_featured` | `boolean` | ✅ | Default `false` |
| `is_active` (topup-level) | `boolean` | ✅ | Saved via `topupService.adminUpdateTopup` separately |
| `logo` / `images` | `File \| null` | ❌ | Optional image upload |

**Saved via**: Two sequential calls in one `mutationFn` — `dashboardService.adminUpdateProductFull(slug, formData)` then `topupService.adminUpdateTopup(slug, { is_active })`.

---

### Top-Up Package

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `name` | `string` | ✅ | Non-empty |
| `amount` | `string` | ✅ | Non-empty string (e.g. `'100'`, `'500 coins'`) |
| `price` | `string` | ✅ | Parsed as float; `> 0`, max 2dp |
| `is_active` | `boolean` | ✅ | Default `true` |
| `is_popular` | `boolean` | ✅ | Default `false` |
| `order` | `number` | ✅ | Display sort order; default `0` |
| `stock_mode` | `'automatic' \| 'manual'` | ✅ | Default `'manual'` for new packages |
| `manual_fulfillment_time` | `string` | If `manual` | Required integer string `> 0` |
| `codes` | `string` (textarea) | If `automatic` + new pkg | Newline-delimited; attached via `codeService.adminAddUpdateDeleteCodes` in `onSuccess` |

**Submitted as**: `FormData` via `topupService.adminAddPackage` / `adminUpdatePackage`

---

### Player Field

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `title` | `string` | ✅ | Non-empty |
| `placeholder` | `string` | ❌ | Optional |
| `key` | `string` | ✅ | Auto-generated from `title` as URL-slug if not provided |
| `field_type` | `'text' \| 'number' \| 'select'` | ✅ | Must be a valid enum value |
| `is_required` | `boolean` | ✅ | Default `true` |
| `order` | `number` | ✅ | Default `0` |
| `min_input_length` | `number` | ✅ | Default `1` |
| `helps` | `FieldHelpForm[]` | ❌ | Nested help items with optional image upload |

---

### Tag

| Field | Type | Notes |
|-------|------|-------|
| `id` | `number` | Server-assigned |
| `name` | `string` | Non-empty; must be unique (server-enforced) |
| `slug` | `string` | Server-assigned |
| `is_active` | `boolean` | Server-managed |

**Operations from product forms**:
- **Create**: `catalogService.adminAddTag({ name })` → `useMutation` → on success: `invalidateQueries(['admin','tags'])`
- **Delete**: `catalogService.adminDeleteTag(id)` → `useMutation` with confirmation → on success: `invalidateQueries(['admin','tags'])` + deselect from `selectedTags`

**staleTime**: `5 * 60 * 1000` — invalidated immediately on any create/delete.

---

### Category

| Field | Type | Notes |
|-------|------|-------|
| `id` | `number` | Referenced by product/topup |
| `name` | `string` | If starts with `'Topup'` → topup category; else → product category |
| `slug` | `string` | — |

**Read-only** in this phase. `staleTime: Infinity`. No create/delete operations on categories.

---

## State Transitions

```
Product stock_mode toggle:
  'automatic' → 'manual'   : codes textarea hidden; fulfillment_time input shown (required)
  'manual'    → 'automatic' : fulfillment_time hidden; codes textarea shown
                              (required ≥1 code on Create; optional on Edit)

Tag lifecycle (from product forms):
  exists-in-list → admin clicks Delete → confirmation dialog → useMutation DELETE
    → on success: invalidateQueries(['admin','tags'])
                + setSelectedTags(prev => prev.filter(id => id !== deletedId))

TopUp Package stock_mode toggle (Edit):
  'manual'    → 'automatic' : codes textarea visible (optional on Edit)
  'automatic' → 'manual'    : codes textarea hidden; fulfillment_time shown (required)

Image (Create/Edit):
  no images → upload file → preview rendered → one must be marked is_main
  remove image → if was is_main → next image auto-promoted to is_main
  existing image removed → id tracked in deletedImages[] for FormData submission
```

---

## Query Key Registry

```ts
// src/hooks/admin/queryKeys.ts
export const adminQueryKeys = {
  products:   (params: ProductListParams)   => ['admin', 'products', params] as const,
  product:    (slug: string)                => ['admin', 'product',  slug]   as const,
  topups:     (params: AdminTopupListParams) => ['admin', 'topups',  params] as const,
  topup:      (slug: string)                => ['admin', 'topup',   slug]   as const,
  packages:   (slug: string)                => ['admin', 'packages', slug]  as const,
  categories: ()                            => ['admin', 'categories']       as const,
  tags:       ()                            => ['admin', 'tags']             as const,
} as const;
```

## Mutation → Invalidation Map

| Mutation | Query Keys Invalidated |
|----------|----------------------|
| `createProduct` | `['admin', 'products']` |
| `updateProduct` | `['admin', 'products']`, `['admin', 'product', slug]` |
| `deleteProduct` | `['admin', 'products']` |
| `updateTopupGameInfo` | `['admin', 'topup', slug]` |
| `saveTopupFields` | `['admin', 'topup', slug]` |
| `saveTopupPackages` | `['admin', 'topup', slug]`, `['admin', 'packages', slug]` |
| `deleteTopup` | `['admin', 'topups']` |
| `deleteField` | `['admin', 'topup', slug]` |
| `deletePackage` | `['admin', 'topup', slug]`, `['admin', 'packages', slug]` |
| `createTag` | `['admin', 'tags']` |
| `deleteTag` | `['admin', 'tags']` |
