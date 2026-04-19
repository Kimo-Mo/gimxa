# Data Model: Admin Order Management

**Feature**: 003-order-management-admin  
**Date**: 2026-04-18  
**Source**: `src/types/admin/orders.ts` (existing) + spec clarifications

---

## Entities

### 1. `OrderStatus` (Union Type)

All 6 values are valid. No deprecated values.

```
'pending' | 'paid' | 'processing' | 'completed' | 'failed' | 'cancelled'
```

Display labels and badge color mappings:

| Value | Label | Badge Style |
|---|---|---|
| `pending` | Pending | `bg-warning/20 text-warning` |
| `paid` | Paid | `bg-emerald-500/20 text-emerald-400` |
| `processing` | Processing | `bg-blue-500/20 text-blue-400` |
| `completed` | Completed | `bg-success/20 text-success` |
| `failed` | Failed | `bg-destructive/20 text-destructive` |
| `cancelled` | Cancelled | `bg-muted/60 text-muted-foreground` |

---

### 2. `AdminOrder` (List Row Shape — from `/orders/admin/all`)

Existing type — no changes required.

| Field | Type | Notes |
|---|---|---|
| `id` | `number` | Numeric DB primary key |
| `order_number` | `string` | Human-readable display ID (used in "View" button click) |
| `status` | `OrderStatus` | Current lifecycle status |
| `total_price` | `string` | Decimal string, must be parsed with `parseFloat` |
| `subtotal` | `string` | Decimal string |
| `tax` | `string` | Decimal string |
| `discount_total` | `string` | Decimal string |
| `coupon_code` | `string \| null` | Null if no coupon applied |
| `created_at` | `string` | ISO 8601 datetime |
| `user` | `string` | Username as returned by list serializer (may be empty → display "Unknown") |
| `items_count` | `number` | Integer count of line items |
| `payment_details` | `OrderPaymentDetails \| null` | Available in list response |

---

### 3. `AdminOrderDetail` (Detail Modal Shape — from `/orders/admin/{id}`)

Existing type — no changes required.

| Field | Type | Notes |
|---|---|---|
| `id` | `number` | Numeric DB primary key |
| `order_number` | `string` | Human-readable display ID |
| `status` | `OrderStatus` | Current lifecycle status |
| `subtotal` | `string` | Decimal string |
| `tax` | `string` | Decimal string |
| `coupon_code` | `string \| null` | Null if no coupon applied |
| `discount_total` | `string` | Decimal string |
| `total_price` | `string` | Decimal string |
| `created_at` | `string` | ISO 8601 datetime |
| `items` | `AdminOrderItem[]` | Line items array |
| `payment_details` | `OrderPaymentDetails \| null` | Null if not yet paid |

---

### 4. `AdminOrderItem` (Line Item — embedded in detail response)

Existing type — no changes required.

| Field | Type | Notes |
|---|---|---|
| `id` | `number` | Line item ID |
| `product_name` | `string` | Product display name |
| `product_slug` | `string` | Product identifier |
| `quantity` | `number` | Units purchased |
| `price` | `string` | Unit price, decimal string |
| `is_topup` | `boolean` | True if this is a top-up item |
| `topup_package` | `number \| null` | Top-up package ID (null if not top-up) |
| `topup_data` | `Record<string, string> \| null` | Player ID fields keyed by field label |
| `created_at` | `string` | ISO 8601 datetime |

---

### 5. `OrderPaymentDetails` (embedded in order)

Existing type — no changes required.

| Field | Type | Notes |
|---|---|---|
| `gateway_id` | `number` | Payment gateway numeric ID |
| `gateway_name` | `string` | Display name of gateway |
| `status` | `string` | Gateway-level status string |
| `amount` | `string` | Decimal string — amount processed |

---

### 6. `AdminOrderUpdatePayload` ← **EXTEND THIS TYPE**

Current type only has `{ status: OrderStatus }`. Must be extended to full PLAN.md contract:

```typescript
export interface AdminOrderUpdatePayload {
  status: OrderStatus;
  send_notification?: boolean;
  notification_data?: {
    subject: string;
    message: string;
    email_type: string;  // default: 'default'
  };
}
```

**Constraint**: `notification_data` is only included in the payload when `send_notification` is `true`. When `send_notification` is omitted/false, `notification_data` MUST also be omitted.

---

### 7. `AdminOrderListParams` (Query Params — existing, no changes)

| Field | Type | Notes |
|---|---|---|
| `status?` | `string` | Filter by exact status value (omit for "all") |
| `page?` | `number` | 1-indexed page number |
| `page_size?` | `number` | Items per page (default: 10) |
| `search?` | `string` | Free-text search on username, full name, or email |

---

### 8. Paginated Response Shape (from PLAN.md)

Response from `GET /orders/admin/all`:

```json
{
  "data": 200,
  "message": "Orders fetched successfully",
  "status": {
    "count": 0,
    "total_pages": 0,
    "current_page": 1,
    "page_size": 10,
    "next": null,
    "previous": null,
    "results": []
  }
}
```

> **Note**: The paginated data lives inside `response.status`, not at the top level. The query hook must unwrap `data.status` and return `{ orders: data.status.results, pagination: { count, total_pages, current_page, page_size } }`.

---

### 9. State Transitions

All-to-all transitions are permitted from the frontend. The backend is the sole enforcement layer. The status selector always presents all 6 options regardless of the current order status.

```
pending ←→ paid ←→ processing ←→ completed
    ↘           ↘           ↘
  failed      failed      failed
    ↘           ↘           ↘
  cancelled  cancelled  cancelled
```

(Diagram is informational — frontend enforces no directionality.)

---

### 10. Zod Validation Schema (for Status Update Form)

```typescript
const notificationSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(1, 'Message is required'),
  email_type: z.string().default('default'),
});

const statusUpdateSchema = z.object({
  status: z.enum(['pending', 'paid', 'processing', 'completed', 'failed', 'cancelled']),
  send_notification: z.boolean().default(false),
  notification_data: notificationSchema.optional(),
}).superRefine((data, ctx) => {
  if (data.send_notification && !data.notification_data?.subject) {
    ctx.addIssue({ code: 'custom', path: ['notification_data', 'subject'], message: 'Subject is required' });
  }
  if (data.send_notification && !data.notification_data?.message) {
    ctx.addIssue({ code: 'custom', path: ['notification_data', 'message'], message: 'Message is required' });
  }
});
```
