# Feature Specification: Admin Order Management

**Feature Branch**: `003-order-management-admin`  
**Created**: 2026-04-18  
**Status**: Draft  
**Input**: User description: "Phase 3: Order Management (Admin View) from PLAN.md"

## Clarifications

### Session 2026-04-18

- Q: Should `AdminOrderUpdatePayload` be extended with notification fields (`send_notification`, `notification_data`) in this phase, or deferred? → A: Extend the type now with `send_notification?: boolean` and `notification_data?: { subject: string; message: string; email_type: string }` — full payload contract ships with Phase 3.
- Q: Should `paid` be a visible filter tab in the orders list UI, given the existing page omits it? → A: Yes — add `paid` as a discrete tab between `pending` and `processing`, giving admins full status visibility: All / Pending / Paid / Processing / Completed / Failed / Cancelled.
- Q: Where should status update and delete actions be triggered from — row actions, detail modal, or both? → A: Detail modal only — the list table is strictly read-only; all mutations (status update, delete) are initiated exclusively from inside the order detail modal.
- Q: What customer identifier should the list table show per row? → A: Show the `user` field value (username/ID as returned by the list API); full customer details (name, email) are reserved for the detail modal.
- Q: Are there frontend-enforced status transition rules, or can admins freely set any status? → A: Free transitions — all 6 statuses are always selectable in the status selector regardless of current status; the backend is the sole enforcement layer. API rejections surface via the standard error display (FR-013).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse & Filter Orders (Priority: P1)

An admin navigates to the Orders section of the dashboard and sees a paginated table of all customer orders. They can filter by order status (e.g., pending, processing, completed, cancelled, failed) and search by customer name, username, or email. They can also sort columns such as total price and creation date to quickly locate relevant orders.

**Why this priority**: Without the ability to view and search orders, none of the admin actions are accessible. This is the foundational view the entire module depends on.

**Independent Test**: Can be fully tested by loading the Orders page, verifying the table renders with correct columns, applying a status filter and observing that only matching orders appear, and using the search box to find an order by customer email.

**Acceptance Scenarios**:

1. **Given** the admin is logged in and navigates to `/dashboard/orders`, **When** the page loads, **Then** a paginated data table is displayed showing a list of all orders with columns for Order ID, Customer, Status, Total Price, and Date.
2. **Given** the orders table is visible, **When** the admin selects any status tab (`Pending`, `Paid`, `Processing`, `Completed`, `Failed`, or `Cancelled`), **Then** only orders with that exact status are shown and the pagination count reflects the filtered results.
3. **Given** the orders table is visible, **When** the admin types a customer's email into the search input, **Then** the table updates to show only orders belonging to that customer.
4. **Given** the orders table is displaying results, **When** the admin clicks on column headers (e.g., "Date" or "Total Price"), **Then** the results are reordered accordingly in ascending or descending order.
5. **Given** the orders span multiple pages, **When** the admin navigates to the next page, **Then** the next set of results loads without a full page refresh, respecting the active filter and search terms.

---

### User Story 2 - View Order Detail (Priority: P2)

An admin clicks on an order row to open a detail modal or panel that shows the full breakdown of the order: customer information, ordered items (product names, quantities, prices), top-up game IDs if applicable, coupon applied, subtotal, discount, and final total.

**Why this priority**: Admins need to review order details before taking any action (approve, reject, refund). This is the decision-making view.

**Independent Test**: Can be tested independently by clicking any order row and verifying the modal displays accurate order data from the detail endpoint without triggering any mutations.

**Acceptance Scenarios**:

1. **Given** an order is listed in the table, **When** the admin clicks the order row or a "View Details" action, **Then** a modal opens displaying the full order breakdown including customer name, email, ordered products, quantities, unit prices, coupon code (if any), subtotal, discount total, and final total.
2. **Given** the order contains a top-up product, **When** the detail modal is open, **Then** the top-up game player ID (and any custom fields provided by the customer) is shown alongside the package details.
3. **Given** the detail modal is open, **When** the admin clicks "Close" or outside the modal, **Then** the modal dismisses without any data changes.

---

### User Story 3 - Update Order Status (Priority: P3)

After reviewing an order in the detail modal, an admin selects a new status (e.g., "processing", "completed", or "cancelled") from a status selector within the modal. A confirmation dialog appears before any change is committed. Optionally, the admin can choose to send a notification email to the customer when updating the status. The list table itself has no mutation controls — it is strictly read-only.

**Why this priority**: Status management is the primary admin action. It directly impacts the customer and business workflow, but requires the view layer (P1, P2) to work first.

**Independent Test**: Can be tested independently by selecting a status update action on an order, confirming the dialog, and verifying the order row reflects the new status without a page reload.

**Acceptance Scenarios**:

1. **Given** an order detail modal is open, **When** the admin selects "Processing" from the status selector and confirms the dialog, **Then** the order status is updated to `processing` and the table reflects the change immediately after the modal closes.
2. **Given** the status update dialog is open, **When** the admin toggles the "Send Notification" option and fills in a subject and message, **Then** the update request includes notification data and the customer receives the email notification.
3. **Given** the admin dismisses the confirmation dialog without confirming, **When** the dialog closes, **Then** no status change is made and the order remains in its previous state.
4. **Given** any status transition is attempted, **When** the API returns an error, **Then** the admin sees a descriptive error message and the order status remains unchanged in the UI.
5. **Given** a valid status update is submitted, **When** the mutation succeeds, **Then** the backend cache is cleared and the order list re-fetches to show the latest data.

---

### User Story 4 - Delete Order (Priority: P4)

An admin permanently deletes an order from the system (e.g., for test or fraudulent orders). A confirmation dialog is required before deletion proceeds.

**Why this priority**: Deletion is a destructive operation and lower priority than status management. It is available for administrative cleanup but is not part of the primary order workflow.

**Independent Test**: Can be tested independently by triggering the delete action on an order, confirming the dialog, and verifying the order no longer appears in the list.

**Acceptance Scenarios**:

1. **Given** an order detail modal is open, **When** the admin clicks "Delete Order" inside the modal and confirms the dialog, **Then** the order is permanently removed, the modal closes, and the order no longer appears in the orders table.
2. **Given** the admin opens the delete confirmation dialog, **When** they click "Cancel", **Then** the dialog closes and the order is not removed.
3. **Given** a delete request is submitted, **When** the API returns an error, **Then** an error message is shown to the admin and the order remains in the list.

---

### Edge Cases

- What happens when a customer's order has zero items or a zero total — is the order still displayed?
- How does the system handle an order status update attempt when the order was already updated by another admin session concurrently? — The frontend performs no conflict detection; the backend will reject or overwrite as per its own rules, and the error will be surfaced via FR-013.
- What happens when the `user` field on an order is null or empty in the list response — the Customer column displays a fallback label (e.g., "Unknown").
- What happens when an admin searches for a term that matches no orders — does an empty state message display?
- How should the notification email fields behave when "Send Notification" is toggled off — are they hidden or just ignored?
- What happens when the orders list API returns a network error on initial load — is an error state displayed with a retry option?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST display all orders in a server-side paginated data table on the admin orders page, showing the following columns per row: Order #, Customer (displaying the `user` field — username as returned by the list API), Status, Total Price, Item Count, and Order Date. Full customer details (name, email) are shown only inside the order detail modal.
- **FR-002**: The system MUST support filtering the orders table by status using a tab strip with an "All Orders" default tab plus one tab per status in this exact order: `All Orders` | `Pending` | `Paid` | `Processing` | `Completed` | `Failed` | `Cancelled`. Selecting a tab filters the server-side query to that status exclusively.
- **FR-003**: The system MUST support free-text search of orders by customer full name, username, or email address.
- **FR-004**: The system MUST support sortable columns (at minimum: total price, creation date) in the orders table.
- **FR-005**: The system MUST support server-side pagination with configurable page size and must display the current page, total pages, and total order count.
- **FR-006**: Admins MUST be able to open a detail modal for any order that shows: full customer identity (name, email, or username as available from the detail endpoint), all order items (product name, quantity, unit price), top-up player IDs and custom fields (if applicable), coupon code, subtotal, discount total, grand total, and payment details.
- **FR-007**: Admins MUST be able to update the status of any order to any of the 6 valid statuses (`pending`, `paid`, `processing`, `completed`, `failed`, `cancelled`) regardless of its current status. No frontend transition restrictions apply; the status selector always presents all 6 options. If the backend rejects a transition, the error is displayed per FR-013.
- **FR-008**: The system MUST present a confirmation dialog before committing any order status update or deletion. Both actions are triggered exclusively from within the order detail modal; the orders list table MUST contain no mutation controls.
- **FR-009**: Admins MUST be able to optionally send a customer notification email when updating an order's status. The update payload MUST include `send_notification: true` and a `notification_data` object containing `subject` (string), `message` (string), and `email_type` (string, default `"default"`). These fields MUST be typed on `AdminOrderUpdatePayload` — not passed as untyped extras.
- **FR-010**: The notification fields (subject, message) MUST only be required in the payload if the "Send Notification" toggle is enabled; when disabled, `send_notification` MUST be omitted or set to `false` and `notification_data` MUST be omitted.
- **FR-011**: The system MUST call the backend cache-clear endpoint followed by a React Query cache invalidation after every successful order mutation (status update or delete), ensuring the table always shows fresh data.
- **FR-012**: Admins MUST be able to permanently delete an order via a dedicated "Delete Order" action inside the detail modal, guarded by a confirmation dialog. Upon successful deletion, the modal MUST close and the orders list MUST refresh.
- **FR-013**: The system MUST display a descriptive, user-friendly error message when any API call fails (list, detail, update, delete).
- **FR-014**: The system MUST display an empty-state message when no orders match the current search or filter criteria.
- **FR-015**: All filter, search, and pagination state MUST be preserved (or restorable) if the admin navigates away and returns, or via URL query parameters.

### Key Entities

- **Order**: Represents a customer purchase. Key attributes: numeric ID, `order_number` (display identifier), status, `user` (username string as returned by list API), `items_count`, `subtotal`, `discount_total`, `total_price`, `coupon_code`, `payment_details`, `created_at`. Full customer identity (name, email) is available in the detail response, not the list response.
- **Order Item**: A line item within an Order. Key attributes: product name, quantity, unit price, top-up package details (if applicable), top-up player ID fields.
- **Order Status**: An enumerated value representing the lifecycle stage of an order. Valid values: `pending`, `paid`, `processing`, `completed`, `failed`, `cancelled`.
- **Order Notification**: An optional notification payload sent to the customer when order status changes. Typed as `notification_data: { subject: string; message: string; email_type: string }`. Only present in the update payload when `send_notification` is `true`.
- **AdminOrderUpdatePayload**: The typed payload for status updates. Shape: `{ status: OrderStatus; send_notification?: boolean; notification_data?: { subject: string; message: string; email_type: string } }`. This full shape MUST be defined in the type system before implementation begins.
- **Pagination Metadata**: Context returned with every list response. Attributes: total count, total pages, current page, page size, next cursor/URL, previous cursor/URL.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An admin can locate any specific order by customer email in under 10 seconds using the search functionality.
- **SC-002**: The orders list page loads and displays data within 3 seconds under normal network conditions.
- **SC-003**: An admin can complete a full order status update workflow (find order → view details → update status → confirm) in under 60 seconds.
- **SC-004**: Zero data inconsistencies occur after any status update — the table always reflects the latest status without requiring a manual page refresh.
- **SC-005**: All status transitions and deletions are preceded by a confirmation step, reducing accidental mutations to zero.
- **SC-006**: When "Send Notification" is enabled, 100% of submitted status updates successfully dispatch the notification payload to the backend.
- **SC-007**: The orders module renders correctly and is fully functional across desktop, tablet, and mobile screen sizes.
- **SC-008**: The module contains zero TypeScript errors and no raw `useEffect`/`useState` data-fetching patterns.

## Assumptions

- Admin users are authenticated via the existing JWT-based auth system and have admin-role permissions; no additional role-gating logic is needed within this module beyond what the API enforces.
- The backend API at `/orders/admin/all` accepts `page`, `page_size`, `search`, and `filter` (by status) as query parameters and returns the paginated response shape defined in PLAN.md.
- The backend API at `/orders/admin/{id}` returns the full order detail including all line items and top-up fields.
- The update endpoint (`PATCH /orders/admin/{id}/`) accepts the payload: `{ status: OrderStatus, send_notification?: boolean, notification_data?: { subject: string; message: string; email_type: string } }` — this full shape MUST be reflected in `AdminOrderUpdatePayload` before implementation begins (resolved in clarification session 2026-04-18).
- A delete endpoint (`DELETE /orders/admin/{id}/`) exists and permanently removes an order.
- The `authService.clearCache()` method and `queryClient.invalidateQueries()` pattern (as established in Phases 1 and 2) will be reused identically in this module.
- The orders page will be located at `/dashboard/orders` within the existing Next.js App Router admin dashboard.
- Mobile responsiveness means the data table collapses to a card/list view on small screens; a full horizontal-scroll table on desktop.
- Email notification types available for `email_type` default to `"default"`; no dynamic type list is needed in the UI at this stage.
- Sorting is handled via query parameters passed to `OrderListParams`; the backend supports sorting by at least `total_price` and `created_at`.
