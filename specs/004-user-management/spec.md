# Feature Specification: User Management (Admin)

**Feature Branch**: `004-user-management`  
**Created**: 2026-04-18  
**Status**: Draft  
**Input**: User description: "Phase 4: User Management — Control user accounts and system roles. List all registered users with search functionality (by email/name). Profile view for users (order history). Admin actions: delete users, reset passwords manually, assign admin privileges. Filter by: role, is_active, provider, is_verified. Search by: username, email, full_name, id."

---

## Clarifications

### Session 2026-04-18

- Q: How should the user profile be presented when the admin selects a user from the list? → A: Modal dialog — profile opens in a centered overlay above the list.
- Q: What should happen when an admin triggers a password reset for a user? → A: Send reset email — backend sends a password reset link to the user's registered email address.
- Q: Where should the admin role change action be triggered from? → A: Inside the profile modal only — role change is an action button within the user's profile modal.
- Q: How should the search query be submitted against the user list? → A: Debounced live search — query fires automatically after a short pause while typing, no submit action required.
- Q: How many users should be displayed per page in the user list? → A: 10 per page — matches the existing Orders module default for consistency across admin list views.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — User List with Search & Filters (Priority: P1)

An admin navigates to the Users section and sees a paginated table of all registered user accounts. They can instantly search across multiple fields (username, email, full name, user ID) and narrow results using filters for role, account status, provider, and verification state.

**Why this priority**: Core entry point for all user management. Without the list view, no further admin actions are possible. Foundational to every other story in this feature.

**Independent Test**: Can be fully tested by loading the Users page, performing a text search and applying at least one filter, and verifying that the displayed rows match the query — delivering the ability to locate any specific user account.

**Acceptance Scenarios**:

1. **Given** the admin is on the Users page, **When** the page loads, **Then** a paginated table of registered users is displayed with columns for username, email, full name, role, account status, provider, and verification state.
2. **Given** the admin types in the search field, **When** they pause briefly after typing, **Then** the search query is sent automatically (debounced) and the table updates to show only users matching the entered username, email, full name, or user ID — without requiring a button press or page reload.
3. **Given** the admin applies a filter (role, is_active, provider, or is_verified), **When** the filter is set, **Then** only users matching all active filter criteria are shown.
4. **Given** no users match the current search/filter combination, **When** the query completes, **Then** an empty state message is shown and no error is displayed.
5. **Given** the user list spans multiple pages (10 users per page), **When** the admin navigates between pages, **Then** the correct subset of users is displayed and the search/filter state is preserved.

---

### User Story 2 — User Profile & Order History View (Priority: P2)

An admin selects a user from the list to open their profile, which shows account details and a chronological history of that user's orders, enabling the admin to understand the user's activity and context before taking any action.

**Why this priority**: A profile view with order history gives admins the context they need before performing sensitive actions (delete, role change). Supports informed decision-making.

**Independent Test**: Can be fully tested by clicking a user row, verifying the profile modal opens above the list with the correct user details and their associated order list.

**Acceptance Scenarios**:

1. **Given** the admin clicks on a user row, **When** the profile modal opens, **Then** it displays the user's account details: username, email, full name, role, status, provider, verification state, and join date — in a centered overlay above the user list.
2. **Given** the profile modal is open, **When** the order history section loads, **Then** a list of that user's orders is shown, each with order ID, date, status, and total amount.
3. **Given** the user has no orders, **When** the order history section loads, **Then** an appropriate empty state message is displayed.
4. **Given** the profile modal is open, **When** the admin closes it (via close button or clicking outside), **Then** the modal dismisses and the user list is visible with their prior search/filter and pagination state intact.

---

### User Story 3 — Admin Actions: Delete User (Priority: P3)

An admin permanently removes a user account from the system after confirming their intent via a confirmation dialog. The action is irreversible and immediately reflected in the user list.

**Why this priority**: Destructive action requiring the highest safeguards. Lower priority than browsing/viewing as it is used infrequently.

**Independent Test**: Can be fully tested by initiating a delete action on a test user, confirming the dialog, and verifying the user no longer appears in the list and all relevant caches are refreshed.

**Acceptance Scenarios**:

1. **Given** the admin triggers the delete action for a user, **When** the confirmation dialog appears, **Then** it clearly states the action is irreversible and requires explicit confirmation.
2. **Given** the confirmation dialog is shown, **When** the admin cancels, **Then** no action is taken and the user account remains intact.
3. **Given** the confirmation dialog is shown, **When** the admin confirms deletion, **Then** the user account is removed and the list refreshes to reflect the change.
4. **Given** a delete operation fails (e.g., network error), **When** the error is received, **Then** a descriptive error message is displayed and the user account is not removed.

---

### User Story 4 — Admin Actions: Assign/Revoke Admin Privileges (Priority: P4)

An admin opens a user's profile modal and promotes a regular user to admin role, or demotes an existing admin back to a regular user. The change requires explicit confirmation before taking effect and is immediately reflected in the user list behind the modal.

**Why this priority**: Role management is a sensitive, lower-frequency action. Placed after delete as it is a non-destructive but high-impact change.

**Independent Test**: Can be fully tested by opening the profile modal for a user, using the role change action within the modal, confirming, and verifying the role field updates in the list visible behind the modal.

**Acceptance Scenarios**:

1. **Given** the admin opens a regular user's profile modal, **When** they trigger the "Assign Admin" action and confirm, **Then** the user's role updates to admin and the change is reflected in the list.
2. **Given** the admin opens an admin user's profile modal, **When** they trigger the "Revoke Admin" action and confirm, **Then** the user's role reverts to regular user and the change is reflected in the list.
3. **Given** the admin is viewing their own profile in the modal, **When** the role change action is shown, **Then** it is disabled or hidden to prevent self-demotion.
4. **Given** a role change operation fails, **When** the error is received, **Then** an error message is shown within the modal and the user's role remains unchanged.

---

### User Story 5 — Admin Actions: Send Password Reset Email (Priority: P5)

An admin triggers the system to send a password reset email to a specific user's registered email address. The system confirms the action before sending and provides clear feedback on success or failure.

**Why this priority**: Least frequently used admin action. Useful for support scenarios but does not block any other user management flow.

**Independent Test**: Can be fully tested by triggering a password reset email for a test user and verifying a success notification appears and (where testable) the email is dispatched.

**Acceptance Scenarios**:

1. **Given** the admin triggers the password reset action for a user, **When** the action is initiated, **Then** a confirmation prompt is shown stating that a reset email will be sent to the user's registered address.
2. **Given** the admin confirms the reset, **When** the operation succeeds, **Then** a success notification is shown confirming the reset email has been dispatched.
3. **Given** the user is registered via a third-party OAuth provider (no local password exists), **When** the reset is attempted, **Then** the backend error is surfaced as a human-readable message explaining the user has no local password.
4. **Given** the reset operation fails for any other reason, **When** the error is received, **Then** a descriptive error message is displayed and no email is sent.

---

### Edge Cases

- What happens when an admin attempts to delete their own account?
- How does the system behave when the search query returns more than the maximum page size?
- What happens if a role change is attempted on the last remaining admin account?
- How are deleted users handled in order history references (e.g., orders placed by a now-deleted user)?
- What happens when a password reset email is requested for a user registered exclusively via a third-party provider (OAuth, no local password)? → The backend error is surfaced as a human-readable message; no email is sent.
- What happens when a filter combination returns zero results — is the experience clearly communicated?

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST display a paginated list of all registered users accessible to admin roles only.
- **FR-002**: The system MUST support text-based search across username, email, full name, and user ID fields simultaneously.
- **FR-003**: The system MUST support filtering the user list by role, active status (`is_active`), authentication provider (`provider`), and verification state (`is_verified`).
- **FR-004**: The system MUST allow the admin to view a detailed profile for any user in a modal dialog, including their account metadata and order history, without navigating away from the user list.
- **FR-005**: The system MUST allow admins to permanently delete a user account, with a mandatory confirmation step before execution.
- **FR-006**: The system MUST allow admins to assign or revoke admin privileges for any user exclusively via an action within the profile modal, with a confirmation step before execution. The action MUST be disabled or hidden when the admin is viewing their own profile.
- **FR-007**: The system MUST allow admins to trigger a password reset email to be sent to a user's registered email address, with a confirmation step before dispatch. If the user has no local password (OAuth-only account), the system MUST surface an appropriate error message.
- **FR-008**: The system MUST refresh the user list and any relevant caches immediately after any successful admin action (delete, role change, password reset).
- **FR-009**: The system MUST display appropriate error messages when any admin action fails, without leaving the UI in an inconsistent state.
- **FR-010**: The system MUST preserve the user's active search, filter, and pagination state when returning from a profile view to the list.
- **FR-011**: The system MUST display an empty state when no users match the current search and filter combination.
- **FR-012**: The system MUST restore the admin's active search, filter, and pagination state exactly as it was when the profile modal is dismissed.

### Key Entities *(include if feature involves data)*

- **User Account**: Represents a registered system user. Key attributes: id, username, email, full name, role (admin/regular), is_active, provider (local/OAuth), is_verified, join date.
- **User Profile**: Extended view of a user account including personal details and linked order history references.
- **Order Summary**: A summarised record of a transaction linked to a user. Key attributes: order ID, date, status, total amount.
- **Admin Action**: A privileged operation (delete, role change, password reset) performed by an admin on a user account, requiring confirmation before execution.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admins can locate any specific user account within 30 seconds using search or filters.
- **SC-002**: The user list loads initial data within 2 seconds under normal network conditions.
- **SC-003**: Search results update automatically within 1 second of the user pausing their input (debounced live search), without requiring a manual submit or page reload.
- **SC-004**: All destructive or privilege-altering actions (delete, role change, password reset) require at least one explicit confirmation step, with zero instances of accidental execution.
- **SC-005**: After any successful admin action, the user list reflects the change within 2 seconds without requiring a full page reload.
- **SC-006**: 100% of API error responses surface a human-readable message to the admin — no silent failures.
- **SC-007**: The user management module is fully usable on screen widths from 768px (tablet) to 1920px (desktop).
- **SC-008**: The user list displays 10 records per page by default, consistent with other admin list views (e.g., Orders).

---

## Assumptions

- The backend API (`user.service.ts`) already exposes the required endpoints: list users with filtering/search params, get user profile with order history, delete user, update user (including role), and trigger password reset.
- Filtering parameters (`role`, `is_active`, `provider`, `is_verified`) and search parameters (`username`, `email`, `full_name`, `id`) are supported server-side and applied via query string.
- Password reset for OAuth/third-party provider accounts may not succeed — the system will surface whatever error the backend returns; graceful UI handling is in scope, backend OAuth password reset logic is out of scope.
- Admins cannot delete their own account; this constraint will be enforced by the backend and surfaced to the UI as an error.
- Pagination is server-side with a default page size of 10 records per page, consistent with other admin list views in the dashboard (e.g., Orders).
- The existing authentication and session management infrastructure is reused; this feature does not introduce a new auth mechanism.
- Role vocabulary is limited to two states: admin and regular user (non-admin). No intermediate roles are in scope for v1.
- Mobile (below 768px) support is out of scope for v1; focus is on tablet and desktop breakpoints.
