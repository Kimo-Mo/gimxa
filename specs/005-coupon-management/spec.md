# Feature Specification: Coupon Management (Admin Dashboard)

**Feature Branch**: `005-coupon-management`  
**Created**: 2026-04-20  
**Status**: Draft  
**Input**: User description: "Phase 5: Coupon Management — Create and track promotional campaigns. List active, upcoming, and expired coupons. Form to create new coupons (Code, Discount Type: fixed/percent, Expiry Date, Usage Limits) with strict Zod validation. Toggle coupon status (Activate/Deactivate) instantly. Data Hooks: coupon.service.ts endpoints."

---

## Clarifications

### Session 2026-04-20

- Q: Should the Coupon Management admin form include a resource-scoping section (restricting which products/categories/packages a coupon applies to)? → A: Yes — in scope for Phase 5. Include product, category, and top-up package scoping tabs in the coupon detail/edit UI.
- Q: Do `expiry_date` and `usage_limit` fields exist in both the backend API and TypeScript types? → A: Yes, fully exist — confirmed via live type updates. Actual field names are `end_at` (expiry), `start_at` (validity start), `max_usage` (usage limit), `used_count` (usage count), `is_active` (active flag), and `scope` (`global(order)` | `product` | `package` | `category`).
- Q: Does a `DELETE /coupons/admin/coupon/{id}/` backend endpoint exist? → A: Yes — fully implement delete with confirmation dialog and mutation. Add `adminDeleteCoupon` method to `coupon.service.ts`.
- Q: What data source feeds the resource picker in the Scoping tab? → A: Reuse existing services — `catalogService` for products & categories, `topupService` for packages. No new backend endpoints needed.
- Q: How should usage history be displayed when an admin clicks the Usage action? → A: Modal dialog — opens a Dialog/Sheet over the list page showing the redemption table.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — View & Filter Coupon List (Priority: P1)

An admin opens the Coupon Management page and sees a complete list of all discount coupons. The list is filterable by status: **Active**, **Upcoming** (start date in the future or not yet activated), and **Expired** (`end_at` in the past). Each row displays the coupon code, scope type, discount type, discount value, start date, end date, usage count (`used_count`), and current status badge. The admin can quickly scan which campaigns are live and which have lapsed.

**Why this priority**: Without the list view, no other coupon action is discoverable. It is the primary entry point for all coupon management.

**Independent Test**: Can be fully tested by navigating to `/dashboard/coupons`, verifying the table renders with correct data columns (including scope, start_at, end_at, used_count), and confirming the status filters work correctly.

**Acceptance Scenarios**:

1. **Given** the admin is on the Coupons page, **When** the page loads, **Then** all coupons are displayed in a table with columns: Code, Scope, Discount Type, Discount Value, Start Date, End Date, Used / Max, and Status.
2. **Given** coupons with different statuses exist, **When** the admin selects the "Active" filter tab, **Then** only coupons with `is_active = true` and `start_at` ≤ now and `end_at` ≥ now (or no `end_at`) are shown.
3. **Given** coupons with different statuses exist, **When** the admin selects the "Expired" filter tab, **Then** only coupons whose `end_at` is in the past are shown.
4. **Given** no coupons exist, **When** the page loads, **Then** an empty state with a clear call-to-action to create the first coupon is displayed.
5. **Given** the coupon list is loading, **When** data is being fetched, **Then** skeleton placeholders are shown for each table row.

---

### User Story 2 — Create a New Coupon (Priority: P1)

An admin clicks "Create Coupon," fills in a creation form, and submits. The form captures: **Code** (alphanumeric, uppercase-forced, required), **Scope** (required: `global(order)`, `product`, `package`, or `category`), **Discount Type** (required: `percent` or `fixed`), **Discount Value** (required, positive; max 100 for percent), **Start Date** (`start_at`, required — when the coupon becomes valid), **End Date** (`end_at`, required — when the coupon expires), **Max Usage** (`max_usage`, optional — positive integer for max total redemptions), and **Active** (`is_active`, boolean toggle, default `true`). All fields are validated with Zod before submission. On success, the list refreshes immediately to show the new coupon.

**Why this priority**: Creating coupons is the core write operation. Without it, the module has no data to manage.

**Independent Test**: Can be fully tested by opening the Create Coupon dialog, submitting valid and invalid form data (including past dates and out-of-range discount values), and confirming the coupon appears in the refreshed list.

**Acceptance Scenarios**:

1. **Given** the admin opens the Create Coupon dialog, **When** they submit with all required fields valid, **Then** the coupon is created and the list auto-refreshes showing the new entry.
2. **Given** the admin submits with an empty or duplicate coupon code, **When** validation runs, **Then** an inline error message is shown below the Code field and submission is blocked.
3. **Given** the admin sets Discount Type to "Percentage" and enters a value greater than 100, **When** validation runs, **Then** an error states the value must be between 1 and 100.
4. **Given** the admin sets End Date (`end_at`) to a past date or earlier than Start Date (`start_at`), **When** Zod validation runs, **Then** submission is blocked with a descriptive date range error.
5. **Given** the admin selects a non-`global` scope (e.g., `product`), **When** the coupon is created, **Then** the system indicates that resource restrictions can be configured in the Scoping tab of the edit view.
6. **Given** the form is in a submitting state, **When** the API call is in progress, **Then** the submit button is disabled and shows a loading indicator.
7. **Given** the API call fails, **When** an error response is returned, **Then** a toast notification displays a descriptive error message and the dialog remains open.

---

### User Story 3 — Edit an Existing Coupon (Priority: P2)

An admin clicks the edit action on any coupon row. A pre-populated form opens with the existing coupon's data. The admin can change Scope, Discount Type, Discount Value, Start Date (`start_at`), End Date (`end_at`), Max Usage (`max_usage`), and Active (`is_active`) status. The coupon Code is read-only and cannot be changed after creation. On save, the list refreshes to reflect the update.

**Why this priority**: Edit is essential for keeping campaigns correct (e.g., extending `end_at`, adjusting discount value), but creating coupons is more time-critical.

**Independent Test**: Can be fully tested by editing an existing coupon's discount value, `end_at`, and `max_usage`, saving, and confirming the table row updates with the new values.

**Acceptance Scenarios**:

1. **Given** the admin opens the Edit dialog for an existing coupon, **When** the dialog opens, **Then** all fields are pre-populated with the coupon's current values including `scope`, `start_at`, `end_at`, `max_usage`, and `is_active`.
2. **Given** the Code field is displayed in the Edit dialog, **When** the admin clicks on it, **Then** it is read-only and cannot be modified.
3. **Given** the admin changes the discount value and `end_at` and saves, **When** the save is successful, **Then** the updated row appears in the list with the new values.
4. **Given** the admin submits invalid data (e.g., 0 discount value or `end_at` before `start_at`), **When** Zod validation runs, **Then** submission is blocked with appropriate error messages.

---

### User Story 4 — Toggle Coupon Active Status (Priority: P2)

An admin can activate or deactivate any coupon directly from the coupon list row without opening the edit dialog. A toggle switch or a quick-action button flips the `is_active` field. The status badge updates immediately after the API confirms the change.

**Why this priority**: Instant status toggling is a high-frequency admin action (e.g., launching a flash sale, ending a campaign early) and should not require opening the full edit form.

**Independent Test**: Can be fully tested by clicking the activate/deactivate toggle on a coupon row and confirming the status badge changes without a full page reload.

**Acceptance Scenarios**:

1. **Given** an Active coupon is in the list, **When** the admin clicks its toggle/deactivate button, **Then** the coupon's status badge changes to "Inactive" after the API confirms.
2. **Given** an Inactive coupon is in the list, **When** the admin clicks its toggle/activate button, **Then** the coupon's status badge changes to "Active" after the API confirms.
3. **Given** the toggle action is in progress, **When** the API call is pending, **Then** the toggle is disabled to prevent double-clicking.
4. **Given** the toggle API call fails, **When** an error is returned, **Then** the status badge reverts to its previous state and a toast error is shown.

---

### User Story 5 — View Coupon Usage History (Priority: P3)

An admin clicks the "Usage" icon on any coupon row. A **modal dialog** opens over the list page displaying a table of all redemptions for that coupon. Each row shows the user identifier, the associated order identifier, and the date/time of redemption (`used_at`). The modal is read-only. The admin closes it to return to the full coupon list.

**Why this priority**: Usage history is a reporting/audit feature. It is valuable but not blocking for core coupon operations.

**Independent Test**: Can be fully tested by clicking the Usage action on a coupon with recorded redemptions and verifying the modal opens and shows user, order, and date for each usage entry.

**Acceptance Scenarios**:

1. **Given** a coupon has redemption records, **When** the admin clicks its Usage icon, **Then** a modal dialog opens displaying all usage entries with user identifier, order reference, and `used_at` timestamp.
2. **Given** a coupon has no redemptions, **When** the admin opens the Usage modal, **Then** an empty state is shown inside the modal indicating no usages yet.
3. **Given** the usage modal is open, **When** the admin clicks outside or the close button, **Then** the modal closes and the coupon list remains unchanged.

---

### User Story 6 — Delete a Coupon (Priority: P3)

An admin can delete a coupon from the list. A confirmation dialog is presented before the deletion is executed to prevent accidental removal. On successful deletion, the coupon is removed from the list.

**Why this priority**: Deletion is a destructive action and lower priority than creation/editing. Coupons can be deactivated instead of deleted in most cases.

**Independent Test**: Can be fully tested by clicking delete on a coupon, confirming the dialog, and verifying the coupon no longer appears in the list.

**Acceptance Scenarios**:

1. **Given** the admin clicks the delete button on a coupon row, **When** the confirmation dialog appears, **Then** clicking "Cancel" closes the dialog without deleting the coupon.
2. **Given** the confirm button is clicked in the deletion dialog, **When** the API call succeeds, **Then** the coupon is removed from the list and a success toast is shown.
3. **Given** the API call fails during deletion, **When** an error response is returned, **Then** an error toast is shown and the coupon remains in the list.

---

### User Story 7 — Scope Coupon to Specific Resources (Priority: P2)

A coupon's `scope` field (`global(order)`, `product`, `package`, or `category`) determines what type of item the discount can be applied to. When scope is `global(order)`, the coupon applies to the entire order with no resource restrictions. When scope is `product`, `package`, or `category`, the admin must attach specific resource IDs using the Scoping tab in the coupon edit view. Each resource addition/removal is its own independent mutation.

**Why this priority**: The `scope` field is a required payload field for coupon creation and directly governs discount eligibility. Misconfigured scoping has direct revenue impact.

**Independent Test**: Can be fully tested by creating a `product`-scoped coupon, attaching a product in the Scoping tab, confirming it appears in the scope list, removing it, and confirming the list is empty.

**Acceptance Scenarios**:

1. **Given** the admin creates a coupon with `scope = global(order)`, **When** the coupon is saved, **Then** the Scoping tab in the edit view is hidden or shows a message that global coupons have no resource restrictions.
2. **Given** the admin creates a coupon with `scope = product`, **When** they open the edit view's Scoping tab, **Then** only the "Products" sub-section is shown with an add/remove interface.
3. **Given** the admin creates a coupon with `scope = category`, **When** they open the Scoping tab, **Then** only the "Categories" sub-section is shown.
4. **Given** the admin adds a resource to the scope list, **When** the action succeeds, **Then** the resource appears in the list and the cache is refreshed.
5. **Given** a resource is in the scope list, **When** the admin removes it and confirms, **Then** it is removed and a success toast is shown.
6. **Given** adding a resource fails (API error), **When** the error response is returned, **Then** a toast error is shown and the resource does not appear in the scope list.

---

### Edge Cases

- What happens when an admin tries to create a coupon with a code that already exists? → The system displays a field-level validation error (from the API response) on the Code field.
- What happens when `max_usage` is set to 0 or a negative number? → Zod validation blocks submission; `max_usage` must be a positive integer or left empty (unlimited).
- What if `end_at` is omitted or not required by the backend? → `end_at` is required per the type definition; Zod enforces it as a required future-date field.
- What if the API returns a coupon list with `used_count` as `null`? → The UI gracefully handles `null`/`undefined` by displaying "0" or "—" as a fallback.
- What happens when `is_active = true` but `end_at` is in the past? → The system displays the coupon as "Expired" based on `end_at`, regardless of the `is_active` flag.
- What happens when `is_active = true` but `start_at` is in the future? → The system displays the coupon as "Upcoming" based on `start_at`.
- What if filtering results in zero matching coupons? → An empty state is shown within the filtered view with a prompt to clear the filter.
- What happens if an admin tries to add a resource already scoped to the coupon? → The API enforces uniqueness and returns an error surfaced as a toast.
- What if there are hundreds of products/categories in the resource picker? → The picker supports search/filter input to find resources without unbounded scrolling.
- What happens if an admin changes a coupon's `scope` from `product` to `global(order)` via edit? → The Scoping tab is hidden; existing resource attachments remain in the backend but are not applied (no frontend restriction is enforced for global coupons).

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST display a list of all coupons with columns: Code, Scope, Discount Type, Discount Value, Start Date (`start_at`), End Date (`end_at`), Used/Max (`used_count` / `max_usage`), and Status.
- **FR-002**: The system MUST support filtering the coupon list by status: All, Active, Upcoming, and Expired — without a full page reload. Status is computed client-side: Active = `is_active=true` AND `start_at` ≤ now AND (`end_at` ≥ now or no `end_at`); Upcoming = `start_at` > now; Expired = `end_at` < now.
- **FR-003**: The system MUST provide a creation form with validated fields: Code (required, alphanumeric, uppercase-forced), Scope (required: `global(order)` | `product` | `package` | `category`), Discount Type (required: `percent` or `fixed`), Discount Value (required, positive; max 100 for percent), Start Date (`start_at`, required), End Date (`end_at`, required, must be after `start_at`), Max Usage (`max_usage`, optional positive integer), and Active (`is_active`, boolean, default `true`).
- **FR-004**: The system MUST validate all coupon form inputs using a Zod schema before any API call is made, displaying inline field-level error messages.
- **FR-005**: The system MUST allow admins to edit an existing coupon's Scope, Discount Type, Discount Value, Start Date, End Date, Max Usage, and Active (`is_active`) status — with the Code field locked as read-only.
- **FR-006**: The system MUST provide a one-click toggle (Activate / Deactivate) directly from the coupon list row that flips `is_active`, without requiring the full edit dialog.
- **FR-007**: The system MUST display coupon usage history (user, order, `used_at`) in a read-only **modal dialog** triggered from a Usage action on each coupon list row. The modal fetches usage data via `useQuery` using `adminCouponUsages(id)`.
- **FR-008**: The system MUST provide a delete action with a confirmation dialog before permanently removing a coupon. An `adminDeleteCoupon(id)` method calling `DELETE /coupons/admin/coupon/{id}/` MUST be added to `coupon.service.ts` if not already present.
- **FR-009**: After every successful create, update, toggle, or delete mutation, the system MUST clear the backend cache (`authService.clearCache()`) and invalidate the React Query cache (`queryClient.invalidateQueries`) so the list reflects fresh data.
- **FR-010**: All data fetching MUST use `useQuery`; all write operations MUST use `useMutation`. Raw `useEffect`/`useState` data-fetching patterns are forbidden.
- **FR-011**: The UI MUST display skeleton loaders while coupon data is being fetched.
- **FR-012**: The UI MUST display informative toast notifications for all mutation outcomes (success and failure).
- **FR-013**: The page MUST be fully responsive across mobile, tablet, and desktop breakpoints.
- **FR-014**: The system MUST provide a Scoping tab within the coupon edit view (visible only when `scope ≠ global(order)`) allowing admins to attach or detach specific resources to a coupon via add/remove actions. The resource picker MUST be fed by `catalogService` (products and categories) and `topupService` (packages), using `useQuery` to fetch available items. The picker MUST support search/filter input when the available list is large. Only the resource type matching the coupon's `scope` field is shown.
- **FR-015**: Each resource-scoping mutation (add or remove) MUST execute independently with its own `useMutation` + cache-clear hook, and the scoped resource list MUST refresh after each action.

### Key Entities

- **Coupon**: Represents a promotional discount. Key attributes: `id`, `code` (unique string), `scope` (`global(order)` | `product` | `package` | `category`), `discount_type` (`percent` | `fixed`), `discount_value` (number), `is_active` (boolean), `start_at` (ISO datetime — validity start), `end_at` (ISO datetime — validity end/expiry), `max_usage` (optional positive integer — total redemption limit), `used_count` (read-only integer — total redemptions so far), `created_at` (timestamp).
- **CouponUsage**: Represents a single redemption of a coupon. Key attributes: `id`, `user` (identifier), `order` (identifier), `used_at` (timestamp). Read-only — created by the system when a coupon is applied by a customer.
- **CouponResource**: Represents an item (Product, Category, or Top-Up Package) that a coupon is restricted to. Managed via separate add/remove endpoints per resource type. An empty resource set means the coupon has no restriction for that type.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admins can create a new coupon end-to-end (open dialog → fill form → submit) in under 60 seconds with no validation confusion.
- **SC-002**: The coupon list reflects the most recent state within 2 seconds of any create, update, toggle, or delete action.
- **SC-003**: All Zod validation errors are surfaced inline on the correct field — 100% of invalid submissions are blocked before reaching the API.
- **SC-004**: Activating or deactivating a coupon from the list row completes the toggle (including UI feedback) in under 3 seconds on a standard connection.
- **SC-005**: The coupon list page loads and displays data (or skeleton) within 1 second of navigation on a standard connection.
- **SC-006**: Zero data-fetching `useEffect`/`useState` patterns remain in any implemented module file — verified by code review.
- **SC-007**: The page renders correctly and is fully usable on screens from 375px (mobile) to 1440px (desktop) width.
- **SC-008**: After each mutation, the cache-clear hook (`authService.clearCache()` → `queryClient.invalidateQueries`) is always invoked before the UI is updated — verified by code review.
- **SC-009**: Admins can add or remove a scoped resource (product, category, or package) and see the updated scope list within 2 seconds of the action completing.

---

## Assumptions

- The `coupon.service.ts` endpoints (`adminCouponsList`, `adminAddCoupon`, `adminUpdateCoupon`, `adminGetCouponDetail`, `adminCouponUsages`) are all implemented and functional. A `DELETE /coupons/admin/coupon/{id}/` endpoint is confirmed to exist on the backend; an `adminDeleteCoupon(id)` method must be added to `coupon.service.ts` during implementation.
- Resource-scoping endpoints (`adminAddProductsToCoupon`, `adminDeleteProductFromCoupon`, `adminAddCategoryToCoupon`, `adminDeleteCategoryFromCoupon`, `adminAddPackageToCoupon`, `adminDeletePackageFromCoupon`) are confirmed to exist in `coupon.service.ts` and are in scope for Phase 5. Resource scoping UI is only shown when a coupon's `scope` is not `global(order)`.
- The resource picker in the Scoping tab reuses `catalogService` (for products and categories) and `topupService` (for packages) — the same services used in Phases 1 & 2. No new backend list endpoints are required.
- The confirmed `AdminCoupon` schema fields are: `id`, `code`, `scope`, `discount_type`, `discount_value`, `is_active`, `start_at`, `end_at`, `max_usage` (optional), `used_count` (optional), `created_at` (optional). The `AdminCouponPayload` mirrors these fields (excluding `id`, `used_count`, `created_at`) with `is_active` optional.
- The `is_active` flag is the primary mechanism for coupon activation/deactivation via `adminUpdateCoupon`.
- Status categorization (Active / Upcoming / Expired) is computed client-side: Active = `is_active=true` AND `start_at` ≤ now AND `end_at` ≥ now; Upcoming = `start_at` > now; Expired = `end_at` < now. `end_at` overrides `is_active` for display purposes.
- Coupon code uniqueness is enforced by the backend; the frontend surfaces the API error message as a field-level error on the Code field.
- The existing `authService.clearCache()` mechanism and `queryClient.invalidateQueries` pattern are already established and must be used as-is, consistent with Phases 1–4.
- Pagination is server-side if the API supports it; if the list endpoint returns all records at once (as the current `adminCouponsList` does), client-side display of all records is acceptable.
- The project uses Tailwind CSS 4, Shadcn/Radix UI components, React Hook Form + Zod for form validation, and TanStack React Query — consistent with all prior phases.
- Mobile support is in scope and must be fully responsive.
