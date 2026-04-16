<!--
SYNC IMPACT REPORT
==================
Version Change: [unversioned template] → 1.0.0
Bump Type: MAJOR — initial ratification; all placeholder tokens replaced with project-specific content.

Modified Principles:
  [PRINCIPLE_1_NAME] → I. Zero-Chat-Spam & Output Discipline
  [PRINCIPLE_2_NAME] → II. Strict TypeScript & No `any`
  [PRINCIPLE_3_NAME] → III. Server State via TanStack React Query (NON-NEGOTIABLE)
  [PRINCIPLE_4_NAME] → IV. Client State via Zustand
  [PRINCIPLE_5_NAME] → V. Componentization & Feature-First Architecture

Added Sections:
  "Technical Stack & Rules" — stack-specific mandates (TypeScript, React Query, Zustand, Tailwind)
  "API & Error Handling"    — Axios, graceful degradation, data integrity rules

Removed Sections: None

Templates Updated:
  ✅ .specify/memory/constitution.md  — this file (fully populated)
  ✅ .specify/templates/plan-template.md — Constitution Check gates updated
  ⚠  .specify/templates/spec-template.md — no structural change required; aligns with current content
  ⚠  .specify/templates/tasks-template.md — no structural change required

Deferred TODOs: None
-->

# Gimxa Constitution

## Core Principles

### I. Zero-Chat-Spam & Output Discipline

Agents and contributors MUST never output large blocks of code in chat or
commit messages. All code changes MUST be made directly in workspace files.
Chat/commit messages MUST contain only 2–3 sentence summaries of the action
taken. This keeps the review loop fast and focused.

**Rationale**: Large inline code blocks slow review cycles and fragment context
across chat and files. Direct file edits with concise summaries are the only
acceptable workflow.

### II. Strict TypeScript & No `any`

All TypeScript code MUST use strictly typed definitions for props, component
state, and API payloads/responses. The use of `any` is **FORBIDDEN**. Unknown
shapes MUST be typed with `unknown` and narrowed explicitly. Zod schemas MUST
be used for runtime validation of external API responses.

**Rationale**: `any` defeats the compiler and silently allows type errors to
reach production. Every type boundary MUST be explicit and verifiable at
compile time.

### III. Server State via TanStack React Query (NON-NEGOTIABLE)

- All data fetching MUST use `useQuery`.
- All data mutations (POST, PUT, PATCH, DELETE) MUST use `useMutation`.
- Every successful mutation MUST call `queryClient.invalidateQueries` with the
  relevant query key(s) to keep the UI in sync with the backend.
- Direct `fetch` or un-wrapped Axios calls outside a Query/Mutation context are
  **FORBIDDEN** for server state.

**Rationale**: React Query is the single source of truth for server state.
Bypassing it creates cache divergence, stale UI, and race conditions.

### IV. Client State via Zustand

Zustand MUST be used exclusively for **client-side transient state**: modal
open/close, sidebar toggles, toast queues, and auth UI flags. Zustand stores
MUST NOT hold server-fetched data (that belongs to React Query cache). Each
store MUST be scoped to a single domain (one store per feature concern).

**Rationale**: Mixing server and client state in a single store leads to
invalidation bugs and over-fetching. Separation of concerns keeps each slice
testable and replaceable.

### V. Componentization & Feature-First Architecture

Absolutely no massive single-file components. UI MUST be broken into small,
reusable, and independently testable components. Components MUST be organized
under `src/components/features/<feature>/` following the Feature-First
architecture. Each component file MUST have a single, clearly named
responsibility. Generic/shared UI primitives belong in `src/components/ui/`.

**Rationale**: Small, colocated components reduce merge conflicts, enable
parallel development, and make UI regression testing tractable.

## Technical Stack & Rules

- **Framework**: Next.js 16 (App Router). Server Components MUST be preferred
  for non-interactive views; Client Components are reserved for interactivity.
- **Styling**: Tailwind CSS 4 exclusively. Inline `style` props and external
  CSS files are FORBIDDEN outside of global resets. All UI MUST be fully
  responsive (Mobile, Tablet, Desktop) and MUST follow accessible design
  patterns (WCAG 2.1 AA minimum).
- **Forms**: React Hook Form + Zod for all user-facing forms. No uncontrolled
  inputs without schema validation.
- **HTTP Client**: The project-configured `api` Axios instance MUST be used for
  all network requests. Its interceptors handle 401 token refresh; do not
  reimplement auth refresh logic inline.
- **UI Components**: Shadcn UI component primitives are preferred for new
  interactive elements; customize via Tailwind class variants, not by forking
  component source unless unavoidable.

## API & Error Handling

- **Graceful Degradation**: A failed API request MUST NEVER crash the UI.
  Every `useQuery` and `useMutation` caller MUST handle `isPending`,
  `isError`, and empty-data states with appropriate loading skeletons or
  user-friendly error messages (e.g., Toast notifications via the global toast
  queue).
- **Data Integrity**: Client-side calculations MUST NOT be used as the source
  of truth for sensitive data (pricing, order totals, permissions, statuses).
  The backend response is always authoritative; display only what the API
  returns.
- **Error Messages**: End-user-facing error messages MUST be human-readable.
  Raw API error bodies or stack traces MUST NEVER be displayed to non-admin
  users.
- **Interceptors**: The Axios `api` instance interceptors handle token refresh
  (401). Code MUST NOT add parallel refresh logic elsewhere.

## Governance

This constitution supersedes all other conventions, README snippets, or verbal
agreements. Any amendment requires:

1. A written diff to this file explaining the principle change.
2. A version bump following the semantic versioning policy below.
3. Propagation of changes to all affected templates listed in the Sync Impact
   Report at the top of this file.

**Versioning Policy**:
- **MAJOR**: Backward-incompatible governance changes — removing or redefining
  core principles.
- **MINOR**: New principle or section added, or materially expanded guidance.
- **PATCH**: Clarifications, wording fixes, non-semantic refinements.

**Compliance Review**: All PRs MUST verify compliance with this constitution
before merge approval. Complexity MUST be justified. Refer to `README.md` for
runtime development guidance and project setup.

**Version**: 1.0.0 | **Ratified**: 2026-04-14 | **Last Amended**: 2026-04-14
