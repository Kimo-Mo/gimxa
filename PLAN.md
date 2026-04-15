# Admin Dashboard Execution Plan (Spec-Driven Development)

## 1. Project Objective
Complete the development and backend API integration of all Admin Dashboard modules using a strict Spec-Kit lifecycle. Every phase must be fully specified, planned, tasked, and implemented before the next begins.

## 2. Technical Stack & Architecture Guidelines
- **Frontend Framework:** Next.js 15 (App Router) with strict TypeScript. No `any` types.
- **State Management:** Zustand (for global UI/Auth state only).
- **Data Fetching:** TanStack React Query — `useQuery` for all fetches, `useMutation` for all writes. Raw `useEffect`/`useState` data-fetching is FORBIDDEN.
- **Styling & UI:** Tailwind CSS 4, Radix UI/Shadcn components. Fully responsive (Mobile, Tablet, Desktop).
- **API Communication:** Axios `api` instance with pre-configured JWT interceptors.
- **Cache-Clear Hook (CRITICAL):** After every successful mutation (`onSuccess`), the implementation MUST:
  1. `await authService.clearCache()` — clears the Django backend cache.
  2. Call `queryClient.invalidateQueries(...)` — refreshes the React Query cache so the UI shows fresh data.
  Both steps are mandatory and must run in this order on every write operation.
- **Code Standards:** Modular architecture. Break all pages into small, focused components.

## 3. Implementation Phases (Spec Kit Workflow)

Each phase represents an isolated module. Execute the strict Spec Kit lifecycle for one phase before moving to the next:
`[ ] /speckit-specify` ➔ `[ ] /speckit-plan` ➔ `[ ] /speckit-tasks` ➔ `[ ] /speckit-implement`

### Phase 1: Products & Top-Up Management Refactor ← CURRENT
- **Objective:** Complete overhaul of the List, Create, and Edit pages for both regular Products and Top-Up products. Eliminate all raw `useEffect`/`useState` data-fetching patterns and replace with React Query throughout.
- **Scope (Products):**
  - List page (`/dashboard/products`) — `useQuery` for product list + categories; `useMutation` for delete + cache-clear hook.
  - Create page (`/dashboard/products/create`) — `useMutation` for create + cache-clear hook; `useQuery` for categories/tags.
  - Edit page (`/dashboard/products/[slug]/edit`) — `useQuery` for product detail + categories/tags; `useMutation` for update, image management, attribute management + cache-clear hook.
- **Scope (Top-Ups):**
  - List page (`/dashboard/topups`) — `useQuery` for topup list + categories; `useMutation` for delete + cache-clear hook.
  - Create page (`/dashboard/topups/create`) — `useMutation` for create + cache-clear hook.
  - Detail/Edit page (`/dashboard/topups/[slug]`) — `useQuery` for topup detail + packages + categories; `useMutation` per section (Game Info, Fields, Packages) each with cache-clear hook.
- **Data Hooks:** `catalogService`, `dashboardService`, `topupService`.

### Phase 2: Product/Package Code Management (formerly Phase 1)
- **Objective:** Integrate code inventory management directly into the product edit pages from Phase 1.
- **Key Features:**
  - On `products/[slug]/edit`: A dedicated "Codes" tab/section showing the live inventory of codes for that product, with `useQuery` for the code list and a bulk-add textarea (`useMutation` + cache-clear hook).
  - On `topups/[slug]`: Within the Packages tab, each package in `automatic` stock_mode shows its live code count and a bulk-add textarea (`useMutation` + cache-clear hook).
  - Invalidate (`is_used = true`) and delete single codes, each with a confirmation dialog and `useMutation` + cache-clear hook.
- **Data Hooks:** `codeService` endpoints.

### Phase 3: Order Management (Admin View)
- **Objective:** Full lifecycle management of customer orders.
- **Key Features:**
  - Data table with server-side pagination, filtering (status: pending, completed, cancelled), and sorting.
  - View detailed order breakdown (products, top-up IDs, customer info) in a Drawer/Modal.
  - Admin actions: Manually approve, reject, or refund orders with confirmation dialogs.
- **Data Hooks:** `orders.service.ts` endpoints.

### Phase 4: User Management
- **Objective:** Control user accounts and system roles.
- **Key Features:**
  - List all registered users with search functionality (by email/name).
  - Profile view for users (order history, wallet balance).
  - Admin actions: Ban/Unban users, reset passwords manually, assign admin privileges.
- **Data Hooks:** `user.service.ts` endpoints.

### Phase 5: Coupon Management
- **Objective:** Create and track promotional campaigns.
- **Key Features:**
  - List active, upcoming, and expired coupons.
  - Form to create new coupons (Code, Discount Type: fixed/percent, Expiry Date, Usage Limits) with strict Zod validation.
  - Toggle coupon status (Activate/Deactivate) instantly.
- **Data Hooks:** `coupon.service.ts` endpoints.

### Phase 6: Notifications Center
- **Objective:** System-wide alerts and push notifications.
- **Key Features:**
  - View system logs and user-targeted notifications history.
  - Broadcast form: Send a global notification to all users or target specific user segments.
  - Delete or mark notifications as resolved.
- **Data Hooks:** `notification.service.ts` endpoints.

## 4. Quality & Validation Gates
Before concluding any Phase's `Implement` step, the agent must verify:
- Zero TypeScript errors in the implemented module.
- React Query successfully fetches, caches, and invalidates data upon mutation.
- Cache-clear hook (`authService.clearCache()` → `queryClient.invalidateQueries`) is called on every `onSuccess`.
- UI components render correctly and responsively without breaking the existing dashboard layout.
- No raw `useEffect`/`useState` data-fetching patterns remain in the implemented module.