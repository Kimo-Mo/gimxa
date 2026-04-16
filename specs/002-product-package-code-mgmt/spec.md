# Feature Specification: Product/Package Code Management

**Feature Branch**: `002-product-package-code-mgmt`
**Created**: 2026-04-16
**Status**: Draft
**Input**: PLAN.md — **Phase 2**: Product/Package Code Management

---

## Clarifications

### Session 2026-04-16

- Q: When an admin invalidates a code, does the UI also allow them to edit the code's string value at the same time, or is `code` passed as the existing value to satisfy the API schema? → A: Option A — The admin can edit the code's string value inside the invalidation confirmation dialog (combined edit + invalidate action). The dialog MUST render an editable input pre-filled with the current code value; the admin may change it before confirming.
- Q: Should the product code list be paginated and, if so, is the page size fixed or configurable? What is the API response shape? → A: Amended — No pagination in product codes (similar to package level). The API response object contains `total_codes` (number of all codes), `available_codes` (number of unused codes — not an array), and `codes` (unpaginated array of all code objects). The `available_codes` field is used directly for count display.
- Q: Does the package-level code endpoint also support pagination? → A: Option B — No pagination for the package-level call; the `available_codes` count is the only thing displayed per-package in the Packages tab. Fetching all codes in one call (or just relying on `available_codes`) keeps the Packages tab simple — there is no full scrollable code table per package, just a count + bulk-add textarea.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — View & Bulk-Add Codes to a Product (Priority: P1)

An admin navigates to the edit page of a digital product (e.g. `/dashboard/products/[slug]/edit`)
and opens a dedicated "Codes" tab or section. They see a live, unpaginated inventory of all codes 
attached to that product, showing each code's value, usage status (`used` / `unused`), and actions 
(invalidate, delete). A summary header displays `total_codes` and `available_codes` counts sourced 
directly from the API response. The admin can paste a batch of new codes into an existing bulk-add 
textarea and submit — the new codes are appended to the inventory, the backend cache is cleared, 
and the code list refreshes to show freshly added codes.

**Why this priority**: Product code inventory is the core stock mechanism for ``automatic`` stock-mode products.
Without codes attached, products cannot be fulfilled. This is the highest-value action for catalog operations.

**Independent Test**: An admin opens a product's edit page, switches to the Codes tab, sees the
live list of codes, pastes 5 new codes into the textarea, submits — and verifies the code count
increases by 5 without a manual refresh.

**Acceptance Scenarios**:

1. **Given** the admin is on `/dashboard/products/[slug]/edit` for a product with `stock_mode = "automatic"`,
   **When** they navigate to the Codes tab/section,
   **Then** a live list of existing codes is displayed — each showing its value and `is_used` status —
   fetched via `useQuery` with the product slug as the query key.
2. **Given** the Codes section is displayed, **When** the code list is loading,
   **Then** a loading skeleton is shown; if the fetch fails, a user-friendly error message with a retry
   option is shown — no blank screen.
3. **Given** the admin types or pastes codes (one per line) into the bulk-add textarea and clicks "Add Codes",
   **When** submission fires, **Then** a `useMutation` is called, on `onSuccess` the backend cache is cleared
   via `authService.clearCache()`, `queryClient.invalidateQueries` is called for the codes query key,
   and the code list refreshes to show the newly added codes.
4. **Given** the bulk-add textarea is empty, **When** the admin clicks "Add Codes",
   **Then** submission is blocked with an inline validation message — no API call is made.
5. **Given** the add-codes mutation fails, **When** the error arrives,
   **Then** a toast error is shown and the textarea retains its unsaved input.

---

### User Story 2 — View Code Inventory & Bulk-Add Codes Per Package (Priority: P1)

On the Top-Up edit page (`/dashboard/topups/[slug]`), within the Packages tab, each package that has
`stock_mode = "automatic"` displays its live code count and an inline bulk-add textarea. The admin can
add new codes for any individual package directly from this view. The system handles each package's code
inventory independently.

**Why this priority**: Top-up packages are the primary revenue unit of the top-up catalog. Keeping each
package's code inventory visible and manageable inline — without navigating away — is essential for
operational efficiency.

**Independent Test**: An admin opens the Packages tab for a top-up, locates an automatic-mode package,
pastes 3 codes into its inline textarea, submits, and verifies the code count for that package increases
by 3 while other packages are unaffected. Testable without interacting with the Products code management flow.

**Acceptance Scenarios**:

1. **Given** the admin is on the Packages tab of a top-up edit page,
   **When** a package has `stock_mode = "automatic"`, **Then** that package row/card shows:
   - The current count of unused codes fetched via `useQuery` (keyed by product slug + package ID).
   - A bulk-add textarea and "Add Codes" button specific to that package.
2. **Given** a package's code count query is loading, **When** displayed next to the package,
   **Then** a small inline loading indicator appears; if the fetch fails, the count shows "—" with
   a retry link — no full-page disruption.
3. **Given** the admin enters codes (one per line) into a package's textarea and clicks "Add Codes",
   **When** the `useMutation` succeeds, **Then** `authService.clearCache()` is called, the codes
   query for that package is invalidated, and the count updates — the other packages are not affected.
4. **Given** a package has `stock_mode = "manual"`, **When** displayed in the Packages tab,
   **Then** no code count or bulk-add textarea is shown for that package.
5. **Given** the bulk-add mutation fails for a package, **When** the error arrives,
   **Then** a toast error specific to that package is shown and the textarea retains its input.

---

### User Story 3 — Invalidate a Single Code (Priority: P2)

An admin views the code list for a product and wants to mark a specific code as used/invalidated
without deleting it from the system (e.g. to manually resolve a fulfillment issue). They click
"Invalidate" next to the code, confirm the dialog, and the code is marked `is_used = true` in
the system — the list refreshes to reflect the status change.

**Why this priority**: Invalidation is an operational safety tool. It lets admins handle
erroneous or duplicate codes without permanently deleting the record. The audit trail is preserved.
Depends on the code list view (US1/US2).

**Independent Test**: An admin opens the Codes list for a product, invalidates one code via the
confirmation dialog, and verifies that code's status changes to "Used" in the list — without
refreshing the page or affecting other codes.

**Acceptance Scenarios**:

1. **Given** the admin clicks "Invalidate" on an unused code, **When** the confirmation dialog appears,
   **Then** it renders an editable input pre-filled with the current code value, a description of the
   action ("This will mark the code as used and it will no longer be available for fulfillment"),
   and "Confirm" and "Cancel" buttons.
2. **Given** the dialog is open, **When** the admin optionally edits the code string and confirms,
   **Then** `useMutation` is called with `{ is_used: true, code: <edited or original value> }`;
   on `onSuccess`, `authService.clearCache()` is called, the codes query is invalidated, and the
   code's row in the refreshed list reflects both the updated status and the updated code value.
3. **Given** the admin confirms without editing the code string, **When** mutation succeeds,
   **Then** the existing code value is sent unchanged and only the status flips to "Used".
4. **Given** the admin cancels the dialog, **When** they return to the list,
   **Then** no mutation is fired and the code remains unchanged.
5. **Given** the invalidation mutation fails, **When** the error arrives,
   **Then** a toast error is shown, the code status is not changed, and the dialog remains open
   so the admin can retry or cancel.
6. **Given** a code already has `is_used = true`, **When** displayed in the list,
   **Then** the "Invalidate" action is hidden or disabled — it cannot be re-invalidated.

---

### User Story 4 — Delete a Single Code (Priority: P2)

An admin wants to permanently remove a specific code from the system (e.g. a duplicate or invalid code).
They click "Delete" on a code, confirm the action in a dialog, and the code is permanently removed —
the list refreshes and the code no longer appears.

**Why this priority**: Permanent deletion is necessary for data hygiene. Ranks below invalidation since
invalidation is the safer, preferred action. Depends on the code list view.

**Independent Test**: An admin deletes one code from a product's code list via the confirmation dialog,
and confirms the total code count decreases by 1 without a page reload.

**Acceptance Scenarios**:

1. **Given** the admin clicks "Delete" on any code, **When** the confirmation dialog appears,
   **Then** it warns that the action is permanent and cannot be undone, with "Delete" and "Cancel" buttons.
2. **Given** the admin confirms deletion, **When** `useMutation` succeeds,
   **Then** `authService.clearCache()` is called, the codes query is invalidated, and the deleted
   code no longer appears in the refreshed list.
3. **Given** the admin cancels the dialog, **When** they return to the list,
   **Then** no mutation is fired and the code remains in the list.
4. **Given** the delete mutation fails, **When** the error arrives,
   **Then** a toast error is shown and the code remains in the list.

---

### Edge Cases

- What if a product has `stock_mode = "manual"`? The Codes tab/section MUST NOT be displayed —
  code management is only relevant for automatic stock mode products.
- What if the codes list has zero codes? An empty-state placeholder ("No codes yet — add some below")
  is shown, with the bulk-add textarea still accessible.
- What if the bulk-add textarea contains blank lines or whitespace-only entries?
  These MUST be stripped before submission — only non-empty, trimmed values are sent to the API.
- What if duplicate codes exist in the textarea input (or duplicates of already-stored codes)?
  The system surfaces any server-side validation error inline without clearing the textarea;
  the admin can correct and resubmit.
- What if many packages on a single top-up are all `automatic` mode? Each package's code count
  query runs independently and in parallel; a slow or failed query for one package MUST NOT
  block or error out the other packages' displays.
- What if `authService.clearCache()` fails after a successful mutation? Log the error silently
  and still call `queryClient.invalidateQueries` — do not block the success toast.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Product Code Inventory (Products Edit Page)

- **FR-C01**: The Existing Codes tab/section on the Product edit page MUST only be rendered when the
  product's `stock_mode` is `"automatic"`. It MUST be hidden entirely for other stock modes.
- **FR-C02**: The code list MUST be fetched via `useQuery`, keyed by the product slug.
  The query MUST use `codeService.adminCodeListForProduct(slug)` without pagination parameters. 
  The API response object contains three fields: `total_codes` (integer count of all codes regardless 
  of status), `available_codes` (integer count of unused codes), and `codes` (unpaginated array of all 
  individual code objects). The UI MUST display both `total_codes` and `available_codes` as a summary 
  header above the list.
- **FR-C03**: The Codes section MUST display each code's value and `is_used` status.
  Used codes MUST be visually distinguished from unused codes (e.g.,badge).
- **FR-C04**: Bulk-adding codes MUST use `useMutation` calling `codeService.adminAddUpdateDeleteCodes`.
  Codes are submitted as a newline-delimited list in the textarea, parsed into an array of strings
  before submission. Blank lines and whitespace-only entries MUST be stripped before the API call.
- **FR-C05**: On `onSuccess` of any code mutation (add, invalidate, delete), the implementation
  MUST `await authService.clearCache()` then call `queryClient.invalidateQueries` for the codes
  query key — in that order.
- **FR-C06**: Invalidating a single code MUST use `useMutation` calling
  `codeService.adminUpdateSingleCode(slug, id, { is_used: true, code: editedCode })`. The confirmation
  dialog MUST render an editable text input pre-filled with the current code value, allowing the admin
  to optionally correct the code string as part of the same action. The submitted payload MUST always
  include both `is_used: true` and the current (or edited) code string. The "Invalidate" action MUST
  be hidden/disabled for codes that are already `is_used = true`.
- **FR-C07**: Deleting a single code MUST use `useMutation` calling
  `codeService.adminDeleteSingleCode(slug, id)`. A confirmation dialog with a permanent-deletion
  warning MUST be shown before the mutation fires.
- **FR-C08**: An empty-state placeholder MUST be displayed when the code list returns zero results.
  The bulk-add textarea MUST remain available in the empty state.

#### Package Code Inventory (Top-Up Packages Tab)

- **FR-P01**: Within the Packages tab on the Top-Up edit page, each package card/row with
  `stock_mode = "automatic"` MUST display the `available_codes` count for that package.
  The value MUST be sourced from the `available_codes` field in the API response — NOT derived
  by filtering the `codes` array client-side. The query MUST use
  `codeService.adminCodeListForProductPackage(slug, { package_id })` via `useQuery`,
  keyed by product slug + package ID.
- **FR-P02**: Each automatic-mode package MUST render an inline bulk-add textarea and "Add Codes"
  button. The `useMutation` MUST call `codeService.adminAddUpdateDeleteCodes` with the appropriate
  `package_id` in the payload. Cache-clear and query invalidation MUST follow the same pattern as FR-C05,
  but the query key MUST be scoped to the package (slug + package ID).
- **FR-P03**: Packages with `stock_mode = "manual"` MUST NOT display any code count or bulk-add UI.
- **FR-P04**: A failed code count fetch for one package MUST NOT affect the display or interaction
  of other packages on the same page.

#### Cross-Cutting

- **FR-X01**: All data fetching in this phase MUST use `useQuery`. All write operations MUST use
  `useMutation`. No raw `useState` + `useEffect` data-fetching patterns are permitted.
- **FR-X02**: Every `useMutation` `onSuccess` callback MUST call `authService.clearCache()` first,
  then `queryClient.invalidateQueries(...)` — both are mandatory on every write.
- **FR-X03**: All loading states MUST render a skeleton or inline loading indicator.
  All error states MUST render a user-friendly message with a retry option.
- **FR-X04**: No `any` TypeScript types. All props, state, query results, and mutation payloads
  MUST be explicitly typed.
- **FR-X05**: Code management UI MUST be extracted into focused, reusable components under
  `src/components/admin/products/` (for product codes) and `src/components/admin/topups/`
  (for package codes) — no monolithic page files.
- **FR-X06**: Confirmation dialogs for invalidate and delete actions MUST clearly communicate
  the consequence and require an explicit user confirmation step before any mutation fires.

### Key Entities

- **Code**: Represents a single fulfillment code. Key attributes: `id`, `code` (string value),
  `is_used` (boolean — `true` means consumed/invalidated, `false` means available), associated
  product slug, optional `package_id` (for top-up packages).
- **Code List Response**: The API response envelope returned by both product and package code
  endpoints. Contains: `total_codes` (integer — number of all codes regardless of status),
  `available_codes` (integer — number of unused codes only), and `codes` (unpaginated array of 
  all Code objects).
- **Product** (automatic stock mode): A digital product that fulfills orders by distributing codes
  from its inventory. Codes are scoped to the product. Inherits slug from Phase 1.
- **Top-Up Package** (automatic stock mode): A denomination tier within a top-up game that maintains
  its own independent code pool. Each package's codes are identified by `package_id` alongside the
  parent product slug.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The Codes tab/section loads and displays the live code list within 3 seconds of
  navigation for any product on a standard broadband connection.
- **SC-002**: After a successful bulk-add, invalidate, or delete mutation, the code list reflects
  the updated state within 2 seconds — without a manual browser refresh.
- **SC-003**: Zero raw `useEffect`/`useState` data-fetching patterns remain in any file introduced
  or modified by this phase.
- **SC-004**: Zero TypeScript compilation errors in the entire module upon delivery.
- **SC-005**: Every failed API call results in a visible, user-facing error (toast or inline message)
  within 2 seconds — zero silent failures.
- **SC-006**: The cache-clear hook (`authService.clearCache()` → `queryClient.invalidateQueries`)
  executes on every `useMutation` `onSuccess` path introduced by this phase.
- **SC-007**: A package with `stock_mode = "manual"` never displays a code count or bulk-add UI —
  verifiable without any API calls.

---

## Assumptions

- `codeService.adminAddUpdateDeleteCodes(slug, payload)` accepts a payload object containing a
  `codes` string and an optional `package_id` string. This is the existing endpoint
  used by the Top-Up create page and top-up mutation hooks — no new endpoint is needed for bulk-add.
- `codeService.adminCodeListForProduct(slug)` returns a response envelope with three fields: 
  `total_codes` (number of all codes regardless of status), `available_codes` (number of unused 
  codes count only), and `codes` (unpaginated array of all Code objects). This shape applies to 
  both the product-level and package-level list endpoints. No pagination parameters are used.
- `codeService.adminCodeListForProductPackage(slug, { package_id })` returns the same response
  envelope (`total_codes`, `available_codes`, `codes`) scoped to the specified package, but
  without pagination (returns all codes at once). The `available_codes` field is used directly
  for the inline count display — no client-side array filtering is needed, and no paginated
  table is displayed. This endpoint already exists in `codeService` and is used as-is.
- `codeService.adminUpdateSingleCode(slug, id, { is_used: true, code: editedCode })` is used for code
  invalidation. The payload always includes both `is_used: true` and the code string value (edited or
  original). No dedicated "invalidate" endpoint exists — the update endpoint handles both status change
  and optional code correction in a single call.
- `codeService.adminDeleteSingleCode(slug, id)` permanently removes the code. The action is
  irreversible and the confirmation dialog must make this explicit.
- The Product edit page (`/dashboard/products/[slug]/edit`) implemented in Phase 1 is the host
  surface for the Codes tab. This phase adds the Codes tab/section without redesigning
  the existing form layout or tabs.
- The Top-Up Packages tab implemented in Phase 1 is the host surface for per-package code management.
  This phase augments each automatic-mode package card with code count and bulk-add UI —
  without altering the existing Package create/edit/delete flows from Phase 1.
- The Codes tab on the Product edit page is NOT shown for products with `stock_mode != "automatic"`.
  The check is based on the already-fetched product data from Phase 1's `useQuery` — no additional
  API call is needed to determine visibility.
- `authService.clearCache()` behavior and failure handling follow the same contract established
  in Phase 1: fire-and-forget, log on failure, MUST NOT block `queryClient.invalidateQueries`.
- The existing Admin Dashboard layout, navigation, and auth guards are not altered by this phase.
