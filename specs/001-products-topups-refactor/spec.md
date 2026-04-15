# Feature Specification: Products & Top-Up Management Refactor

**Feature Branch**: `001-products-topups-refactor`
**Created**: 2026-04-15
**Status**: Draft
**Input**: PLAN.md — **Phase 1**: Products & Top-Up Management Refactor

---

## Clarifications

### Session 2026-04-15

- Q: Should the topup product exclusion on the Products list use a server-side `product_type` filter param or client-side array filter? → A: Server-side — pass `product_type` exclusion param to `adminProductsList` for accurate paginated counts.
- Q: What are the client-side price validation rules for products and packages? → A: Positive decimal, maximum 2 decimal places (`> 0`, e.g. `9.99`), no upper limit.
- Q: Which endpoint should the top-up delete mutation use? → A: `catalogService.adminDeleteProduct(slug)` — the general product delete endpoint, consistent with the existing legacy behavior.
- Q: What staleTime applies to categories and tags queries, and how are new tags handled? → A: Categories `staleTime: Infinity` (static reference data). Tags `staleTime: 5 min`; when a new tag is created, `queryClient.invalidateQueries` for the tags key MUST be called immediately. Admins must also be able to delete tags from within the Create/Edit Product forms.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Browse & Delete Products (Priority: P1)

An admin navigates to the Products list page and sees a paginated, server-side
table of all non-top-up digital products. They can search by name and filter by
category. The count, pagination controls, and loading/error states all respond
correctly. An admin can delete a product after confirming a dialog — the list
refreshes immediately and reflects the deletion without a manual page reload.

**Why this priority**: The list is the entry point for all product management.
It must work reliably before create or edit flows are useful.

**Independent Test**: An admin views the product list, applies a search filter,
navigates pages, deletes one product, confirms the list auto-refreshes — all
without visiting create or edit routes.

**Acceptance Scenarios**:

1. **Given** the admin is on the Products list, **When** the page loads,
   **Then** a server-side paginated table of products renders within 3 seconds,
   with columns for Name, Category, Stock Mode, Status, and Actions.
2. **Given** the product list is displayed, **When** the admin types in the
   search field (with 400 ms debounce), **Then** the list filters to matching
   products without a full page reload.
3. **Given** a category filter is applied, **When** the admin selects a different
   category, **Then** the list resets to page 1 and re-fetches filtered results.
4. **Given** the admin clicks "Delete" on a product row, **When** they confirm
   the dialog, **Then** the backend cache is cleared, the product list query is
   invalidated, the list refreshes, and the deleted product no longer appears.
5. **Given** the product list fetch fails, **When** an error occurs,
   **Then** the admin sees a user-friendly error message and a retry action —
   no crash.

---

### User Story 2 — Create a New Product (Priority: P2)

An admin fills in a form to create a new digital (non-top-up) product: name,
price, stock mode, category, tags, images, optional attributes, and
(for automatic stock mode) initial fulfillment codes. Submitting the form
creates the product, clears the Django backend cache, and navigates the admin
back to the product list.

**Why this priority**: Creating products is the primary growth action for the
catalog. Depends on the categories/tags lists being fetchable (also covered here).

**Independent Test**: An admin completes and submits the create form with valid
data; the product appears on the list page and the form shows appropriate
validation errors when required fields are missing.

**Acceptance Scenarios**:

1. **Given** the admin is on the Create Product form, **When** they submit
   with a missing required field (Name, Price, Category, or Stock Mode),
   **Then** the specific field is highlighted with an inline error and
   submission is blocked.
2. **Given** stock mode is set to "Automatic", **When** the admin submits
   without providing at least one fulfillment code, **Then** submission is
   blocked with an inline error on the Codes field.
3. **Given** the admin selects "Manual" stock mode, **When** they submit
   without a fulfillment time, **Then** submission is blocked with an inline
   error on that field.
4. **Given** all required fields are valid, **When** the admin submits,
   **Then** the product is created, the backend cache is cleared,
   `queryClient.invalidateQueries` is called for the products list, and the
   admin is redirected to `/dashboard/products`.
5. **Given** the form submission fails with a validation error from the server,
   **When** the error response arrives, **Then** field-level errors from the
   server are displayed inline and the form is not reset.
6. **Given** the admin clicks "Delete" next to an existing tag in the tag
   management area, **When** they confirm, **Then** the tag is permanently
   deleted via `useMutation`, the tags query is invalidated, and the tag is
   removed from the list and deselected on the current product.

---

### User Story 3 — Edit an Existing Product (Priority: P2)

An admin navigates to the edit page for a specific product. The form loads
pre-filled with the current product data. The admin can update any field —
basic info, images, tags, attributes, and (for automatic stock mode) add new
codes — and save. The UI reflects the saved state immediately after success.

**Why this priority**: Most catalog maintenance is edits, not creates. Must come
after the list and create flows are stable.

**Independent Test**: An admin edits the name and price of an existing product,
saves, and sees the updated values reflected on the list page — verifiable
without touching the create flow.

**Acceptance Scenarios**:

1. **Given** the admin navigates to `/dashboard/products/[slug]/edit`,
   **When** the page loads, **Then** all fields are pre-filled with the
   current product data from the server — no manual re-entry required.
2. **Given** the admin updates the product name and saves, **When** success,
   **Then** the backend cache is cleared, the product detail and list queries
   are invalidated, and a success toast is shown.
3. **Given** the admin adds a new image and marks it as the main image,
   **When** they save, **Then** the main image is updated on the product.
4. **Given** the admin removes an existing attribute and adds a new one,
   **When** they save, **Then** only the new attribute appears in the saved
   product.
5. **Given** stock mode is "Automatic", **When** the admin adds codes in the
   Codes textarea and saves, **Then** the new codes are appended to the
   existing code inventory for that product.
6. **Given** the save request fails, **When** the error arrives,
   **Then** a toast error is shown and the form retains its unsaved values.
7. **Given** the admin deletes a tag from the tag management area and confirms,
   **When** success, **Then** the tag is permanently removed, the tags query
   is invalidated, and the tag is deselected on the current product if it was
   previously applied.

---

### User Story 4 — Browse & Delete Top-Up Products (Priority: P1)

An admin navigates to the Top-Ups list and sees a paginated table of all
top-up products. They can search and filter by top-up category. Deleting a
top-up follows the same pattern as deleting a regular product — confirmation,
cache clear, and automatic list refresh.

**Why this priority**: Same foundational importance as the Products list for
the top-up catalog.

**Independent Test**: An admin views, searches, and deletes a top-up from
the list — independent of the detail/edit flow.

**Acceptance Scenarios**:

1. **Given** the admin is on the Top-Ups list, **When** the page loads,
   **Then** a paginated table of top-up products renders with Name, Category,
   Active Status, and Actions columns.
2. **Given** a search term is entered, **When** the debounce fires,
   **Then** the list filters server-side to matching top-up products.
3. **Given** the admin deletes a top-up and confirms, **When** success,
   **Then** the backend cache is cleared, the query is invalidated, and the
   top-up is removed from the list without a page reload.

---

### User Story 5 — Edit a Top-Up Product (Priority: P3)

An admin navigates to `/dashboard/topups/[slug]` and manages a top-up product
through three tabs: Game Info, Player Fields, and Packages. Each tab has its
own independent save action. Saving any tab calls the backend cache clear hook
and invalidates the relevant React Query keys before showing a success toast.

**Why this priority**: Top-up editing is the most complex surface — it
coordinates multiple independent sub-resources (fields, packages, nested field
helps). It depends on the list being stable (US4).

**Independent Test**: An admin updates the game name in the Game Info tab,
saves, and sees the updated name reflected without refreshing the page.

**Acceptance Scenarios**:

1. **Given** the admin opens a top-up detail page, **When** it loads,
   **Then** all three tabs (Game Info, Player Fields, Packages) populate
   with the current data fetched via `useQuery`.
2. **Given** the admin edits the Game Info and saves, **When** success,
   **Then** the backend cache is cleared, relevant queries are invalidated,
   and a success toast appears — the tab retains focus.
3. **Given** the admin adds a new Player Field with a title and submits the
   Fields tab, **When** success, **Then** the new field is persisted and the
   fields list re-fetches to show it with a server-assigned `id`.
4. **Given** the admin adds a new Package with `stock_mode = "automatic"` and
   provides fulfillment codes, **When** they save the Packages tab,
   **Then** the package is created and codes are attached in the same save
   cycle — with cache clear and query invalidation on success.
5. **Given** the admin deletes a package and confirms the dialog,
   **When** success, **Then** the package is removed, cache is cleared, and
   the packages list auto-refreshes.
6. **Given** any tab's save fails, **When** the error arrives,
   **Then** a toast error is displayed and no data is lost from the form.

---

### Edge Cases

- What if a product has no images? The image upload area renders an empty state
  with a clear upload prompt; saving without an image is only blocked on Create
  (at least one image required), not on Edit.
- What if `adminCategoriesList` fails? Categories/tags dropdowns show an empty
  state with a "Failed to load" message; the form remains usable for fields
  that don't depend on categories.
- What if the backend returns partial validation errors? All field-level errors
  from the server response MUST be mapped to the corresponding form field and
  displayed inline — never swallowed silently.
- What if `authService.clearCache()` fails? Log the error silently; still
  call `queryClient.invalidateQueries` to at least refresh the React Query
  cache. Do not block the success toast or navigation.
- What if a top-up package is switched from "manual" to "automatic" stock mode
  on edit? The codes textarea becomes visible and required.
- What if the admin tries to delete a top-up with active orders? Display the
  backend error message inside the confirmation dialog.
- What if an admin deletes a tag that is currently selected on the product
  being edited? The tag MUST be automatically deselected and the `selectedTags`
  state updated before the mutation fires — the product itself is not re-saved.
- What if `adminDeleteTag` does not yet exist in `catalogService`? A new
  `adminDeleteTag(id: number)` method calling `DELETE /catalog/admin/tags/{id}/`
  MUST be added to `catalogService` as part of this phase.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Products

- **FR-P01**: The Products list page MUST fetch products via `useQuery` with
  server-side pagination (`page`, `page_size`), `search`, `category`, and a
  `product_type` exclusion param that filters out top-up products at the API
  level — ensuring pagination counts are accurate and no client-side array
  filtering is needed.
- **FR-P02**: The Products list MUST use a 400 ms debounce on the search input
  before triggering a re-fetch.
- **FR-P03**: Product deletion MUST use `useMutation`; on `onSuccess` it MUST
  `await authService.clearCache()` then call `queryClient.invalidateQueries` for
  the products list query key.
- **FR-P04**: Categories MUST be fetched via `useQuery` with `staleTime: Infinity`
  (static reference data; fetched once per session). Tags MUST be fetched via
  `useQuery` with `staleTime: 5 * 60 * 1000` (5 minutes). Both queries are shared
  across Create and Edit pages via the same query key.
- **FR-P05**: Product creation MUST use `useMutation` with the cache-clear hook
  on `onSuccess`; on success the admin MUST be navigated back to the list.
- **FR-P06**: The Edit Product page MUST fetch the product detail, categories,
  and tags via `useQuery` (keyed by slug).
- **FR-P07**: Product update MUST use `useMutation` with the cache-clear hook
  on `onSuccess`.
- **FR-P08**: All form fields on Create and Edit MUST be validated client-side
  before submission; server-side validation errors MUST be surfaced inline.
  Price validation rule: MUST be `> 0`, numeric, and have at most 2 decimal
  places (e.g. `9.99` valid; `0`, `-1`, `9.999` invalid). This rule applies
  to both Product price and Top-Up Package price fields.
- **FR-P09**: For products with `stock_mode = "automatic"`, the Codes textarea
  MUST be displayed on both Create and Edit pages; codes are newline-delimited
  and submitted as a JSON array string.
- **FR-P10**: When a new tag is created inline (within Create or Edit Product),
  the creation MUST use `useMutation`; on `onSuccess`, `queryClient.invalidateQueries`
  for the tags query key MUST be called immediately so the new tag appears in the
  list without a page reload.
- **FR-P11**: Admins MUST be able to delete any existing tag from within the
  Create and Edit Product forms. Tag deletion MUST use `useMutation`; on
  `onSuccess`, `queryClient.invalidateQueries` for the tags query key MUST be
  called and the deleted tag MUST be automatically deselected if it was applied
  to the current product. Deletion MUST require a confirmation step.

#### Top-Ups

- **FR-T01**: The Top-Ups list page MUST fetch top-up games via `useQuery` with
  server-side pagination and search parameters; category filtering is client-side
  over the fetched page.
- **FR-T02**: Top-up deletion MUST use `useMutation` calling
  `catalogService.adminDeleteProduct(slug)`, followed by the cache-clear hook
  on `onSuccess`. (`topupService.adminDeleteTopup` is intentionally NOT used
  here — the general product endpoint is the established contract.)
- **FR-T03**: The Top-Up detail/edit page MUST fetch game detail, package list,
  and categories in a single coordinated `useQuery` (or parallel queries) keyed
  by slug.
- **FR-T04**: Saving Game Info MUST use `useMutation` with the cache-clear hook
  on `onSuccess`; it MUST NOT navigate away — the tab retains focus.
- **FR-T05**: Saving Player Fields MUST use `useMutation` with the cache-clear
  hook on `onSuccess`; the fields list MUST re-fetch to reflect server-assigned
  IDs on newly created fields.
- **FR-T06**: Saving Packages MUST use `useMutation`; if any new package has
  `stock_mode = "automatic"` and non-empty codes, the codes MUST be attached
  (via `codeService`) in the same `onSuccess` callback before the cache-clear
  and query invalidation calls.
- **FR-T07**: Deleting a field or package MUST use `useMutation` with the
  cache-clear hook on `onSuccess`; the UI MUST reflect the deletion without a
  full page reload.
- **FR-T08**: Package deletion and field deletion each MUST require a
  confirmation dialog before the mutation fires.

#### Cross-Cutting

- **FR-X01**: Every page in this phase MUST eliminate all raw `useState` +
  `useEffect` data-fetching patterns. Only React Query hooks are permitted for
  server data.
- **FR-X02**: Every `useMutation` `onSuccess` callback MUST execute
  `await authService.clearCache()` followed immediately by
  `queryClient.invalidateQueries(...)` with the relevant query key(s).
- **FR-X03**: Every page MUST display a loading skeleton while data is fetching
  and a user-friendly error state if the fetch fails — no blank/crashed screens.
- **FR-X04**: No `any` TypeScript types are permitted anywhere in this module.
  All props, state, query results, and mutation payloads MUST be explicitly typed.
- **FR-X05**: All components MUST be split into small, focused files under
  `src/components/admin/products/` and `src/components/admin/topups/` respectively.
  No monolithic page files that contain both logic and JSX for multiple sections.

### Key Entities

- **Product** (non-top-up): Name, price (positive decimal, max 2dp, no upper
  limit), stock mode (`automatic`|`manual`), fulfillment time, short description,
  description, visibility flags (`is_active`, `is_available`, `is_popular`,
  `is_featured`), region, category (single), tags (multi), images (multi, one
  marked `is_main`), attributes (key-value pairs), codes (for automatic mode).
- **Top-Up Game**: Associated Product (name, slug, images, categories, flags),
  `is_active` flag, Player Fields (ordered list of input field definitions with
  nested Help items), Packages (denomination tiers with price, stock mode, and
  optional fulfillment codes).
- **Top-Up Package**: Name, amount, price (positive decimal, max 2dp, no upper
  limit), `is_active`, `is_popular`, display order, stock mode
  (`automatic`|`manual`), fulfillment time (manual only), codes textarea
  (automatic only, for initial code seeding on create).
- **Player Field**: Title, placeholder, key (URL-slug-style), field type
  (text/number/select), required flag, display order, minimum input length,
  Help Items (description + optional image).
- **Category / Tag**: Referenced by ID. Categories are fetched once per session
  (`staleTime: Infinity`). Tags are refreshed every 5 minutes and invalidated
  immediately after any create or delete operation. Tags are **deletable** from
  within the product forms; deletion is permanent and affects all products that
  use the tag.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every Products and Top-Ups list page loads and renders within
  3 seconds on a standard broadband connection with no TypeScript errors.
- **SC-002**: After any successful create, update, or delete mutation, the
  relevant list or detail view reflects the new state within 2 seconds —
  without a manual browser refresh.
- **SC-003**: Zero raw `useEffect`/`useState` data-fetching patterns remain
  in any file touched by this phase after implementation is complete.
- **SC-004**: Zero TypeScript compilation errors in the entire module upon
  delivery.
- **SC-005**: Every failed API call (any HTTP 4xx/5xx) results in a visible
  user-facing error (toast or inline) within 2 seconds — zero silent failures.
- **SC-006**: The cache-clear hook (`authService.clearCache()` → `invalidateQueries`)
  executes in every `useMutation` `onSuccess` path across all 6 pages covered
  by this phase.

---

## Assumptions

- `authService.clearCache()` calls `POST /auth/clear-cache/` which invalidates
  the Django server-side cache. It is fire-and-forget safe (if it fails,
  implementation should log and continue — it MUST NOT block `invalidateQueries`).
- Server-side pagination is supported for both Products and Top-Ups list
  endpoints (page/page_size params). Category filtering for top-ups is done
  client-side over the current page's results (per existing behavior).
- A product with `product_type = "topup"` is excluded from the Products list
  via a server-side `product_type` query parameter passed to `adminProductsList`.
  The client-side `.filter()` used in the legacy page is removed.
- The existing component subtrees for both Products and Top-Ups
  (`src/components/admin/products/`, `src/components/admin/topups/`) already
  contain the UI building blocks (forms, tables, dialogs). The refactor migrates
  their data wiring to React Query without redesigning the visual structure.
- The `dashboardService.adminUpdateProductFull` and
  `dashboardService.adminCreateProductFull` endpoints accept `multipart/form-data`.
  FormData construction logic is preserved from the existing implementation —
  only the mutation wrapper changes.
- For the Top-Up detail page, Game Info and Top-Up active status are saved via
  two sequential calls (`dashboardService.adminUpdateProductFull` +
  `topupService.adminUpdateTopup`) within a single `useMutation` `mutationFn`.
  This matches the existing behavior.
- The existing Admin Dashboard layout, navigation, and auth guards are not
  altered by this phase.
- Top-up deletion calls `catalogService.adminDeleteProduct(slug)`, not
  `topupService.adminDeleteTopup`. This matches the legacy page behavior and
  is the intentional contract for this phase.
