# Implementation Plan: Product/Package Code Management

**Branch**: `002-product-package-code-mgmt` | **Date**: 2026-04-16 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/002-product-package-code-mgmt/spec.md`

## Summary

Augment the Phase 1 product and top-up edit pages with live code inventory management: an unpaginated `useQuery`-driven code list on the product edit page (with invalidate + delete + bulk-add), and per-package `available_codes` counters + bulk-add on the top-up Packages tab. All writes use `useMutation` with the mandatory cache-clear + `invalidateQueries` hook. Two type gaps are patched first (`AdminCodeUpdatePayload`, `AdminCodeListResponse`), then new focused components and hooks are created before wiring them into the host pages.

## Technical Context

**Language/Version**: TypeScript 5 / Next.js 16 (App Router)  
**Primary Dependencies**: TanStack React Query v5, Axios (`api` instance), Shadcn UI, Tailwind CSS 4, Sonner (toast)  
**Storage**: N/A (frontend only; backend is Django REST Framework)  
**Testing**: TypeScript compiler (`tsc --noEmit`) as primary gate; manual smoke test per acceptance scenario  
**Target Platform**: Admin dashboard web (browser, SSR irrelevant — all admin pages are Client Components)  
**Project Type**: Web application — admin dashboard feature augmentation  
**Performance Goals**: Code list renders within 3 s on standard broadband (SC-001); mutation state reflects within 2 s (SC-002)  
**Constraints**: No raw `useEffect`/`useState` for data fetching; zero `any` types; cache-clear hook mandatory on every `onSuccess`  
**Scale/Scope**: Single product or package at a time; code lists are not expected to exceed a few thousand rows

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Gate | Status |
|---|------|--------|
| 1 | **Output Discipline** — No large code blocks in chat; all changes go directly to files with 2–3 sentence summaries | ✅ |
| 2 | **TypeScript Strictness** — All props, state, and payloads typed; zero `any` usage; Zod schemas for API responses | ✅ — `AdminCodeListResponse` and `is_used` extension added to types |
| 3 | **React Query** — All fetches use `useQuery`; all mutations use `useMutation` + `queryClient.invalidateQueries` on success | ✅ |
| 4 | **Zustand Scope** — Stores cover client-only transient state only; no server data stored in Zustand | ✅ — no Zustand stores introduced by this feature |
| 5 | **Componentization** — No single-file megacomponents; features colocated under `src/components/admin/<feature>/` | ✅ — new components in `products/` and `topups/` |
| 6 | **Axios Instance** — All HTTP calls go through the configured `api` instance; no raw fetch | ✅ — all calls go through existing `codeService` which uses `api` |
| 7 | **Graceful Degradation** — Every query/mutation handles `isPending`, `isError`, and empty states | ✅ — loading skeletons, empty-state placeholder, error retry all required by spec |
| 8 | **Data Integrity** — `available_codes` / `total_codes` sourced directly from API response only | ✅ — spec explicitly forbids client-side derivation from array length |
| 9 | **Tailwind Only** — No inline `style` props; fully responsive | ✅ |

**Post-Design Re-check**: All gates pass. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/002-product-package-code-mgmt/
├── plan.md              ← this file
├── research.md          ← Phase 0 complete
├── data-model.md        ← Phase 1 complete
├── quickstart.md        ← Phase 1 complete
└── tasks.md             ← Phase 2 output (/speckit-tasks)
```

### Source Code Changes

```text
src/
├── types/
│   └── admin/
│       └── codes.ts                    ← PATCH: add AdminCodeListResponse; extend AdminCodeUpdatePayload
│
├── hooks/admin/
│   ├── useProductCodesQuery.ts         ← NEW: useProductCodesQuery(slug)
│   ├── usePackageCodesQuery.ts         ← NEW: usePackageCodesQuery(slug, packageId)
│   ├── useCodeMutations.ts             ← NEW: useAddProductCodesMutation, useInvalidateCodeMutation, useDeleteCodeMutation
│   └── usePackageCodeMutations.ts      ← NEW: useAddPackageCodesMutation(slug, packageId)
│
├── components/admin/products/
│   ├── ProductCodeInventory.tsx        ← NEW: host container (replaces plain ProductCodes role)
│   ├── CodeInventoryTable.tsx          ← NEW: unpaginated code list table with actions
│   ├── CodeSummaryHeader.tsx           ← NEW: total_codes / available_codes display
│   ├── BulkAddCodesForm.tsx            ← NEW: textarea + submit for product-level bulk add
│   ├── InvalidateCodeDialog.tsx        ← NEW: dialog with editable code input + is_used=true
│   └── DeleteCodeDialog.tsx            ← NEW: permanent deletion confirmation dialog
│
└── components/admin/topups/
    ├── PackageCodeSection.tsx           ← NEW: per-package available_codes count + bulk-add
    └── BulkAddPackageCodesForm.tsx      ← NEW: inline textarea + submit scoped to one package

src/app/(admin)/dashboard/products/[slug]/edit/page.tsx   ← PATCH: replace <ProductCodes> with <ProductCodeInventory>
src/app/(admin)/dashboard/topups/[slug]/page.tsx          ← PATCH: augment PackagesTab with <PackageCodeSection> per automatic package
```
