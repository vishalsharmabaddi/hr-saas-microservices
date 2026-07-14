# Platform Console → Real DB — Design Spec

**Date:** 2026-07-14
**Feature:** Replace the Platform Console's localStorage mock data with real, owner-gated,
cross-tenant data from the database. The owner can view all companies with real user counts and MRR,
and suspend/activate or change a company's plan.

## Current state

- `worktrack-frontend/src/platform/platformData.js` holds a hardcoded `SEED` of fake companies in
  `localStorage` (`wt_platform_companies`). `PlatformAdminPage.jsx` reads/writes it.
- Real `Company` (project-service) has: `id, name, domain, logoUrl, isActive, createdAt`. **No `plan`.**
- Platform owner is a **frontend-only** hardcoded email (`auth/roles.js` `SUPER_ADMINS`).
- `GET /api/companies` already returns ALL companies with no owner gating (a separate leak — noted).

## Decisions (locked with user)

- **Users/Seats** = count of **app login users (memberships)** per company (project-service, no cross-service call).
- Actions: **View + Suspend/Activate + Change plan** (not read-only).
- MRR/stats computed on the **frontend** (pricing lives in `PLANS`); backend returns `plan` + `userCount`.

## Backend (project-service — owns Company + memberships)

### 1. Company entity
- Add `plan` (String, default `"FREE"`). Status uses existing `isActive` (true = active, false = suspended).

### 2. Owner gating (server-side — fixes audit M5)
- Configurable owner list: `app.platform.owner-emails` (comma-separated, default `vishalsharmabaddi@gmail.com`),
  read via `${PLATFORM_OWNER_EMAILS:vishalsharmabaddi@gmail.com}`.
- A `PlatformGuard.requireOwner(email, ownerList)` that compares the **verified** `X-User-Email`
  (set by TenantFilter from the token subject) against the list; throws 403 if not an owner.

### 3. Endpoints — new `PlatformController` at `/api/platform` (all owner-gated)
| Method / path | Body | Returns |
|---|---|---|
| `GET /api/platform/companies` | — | list of `{ id, name, domain, plan, isActive, createdAt, userCount }` |
| `PUT /api/platform/companies/{id}/status` | `{ active: boolean }` | updated company |
| `PUT /api/platform/companies/{id}/plan` | `{ plan: "FREE"\|"PRO"\|"BUSINESS" }` | updated company |

- `userCount` = memberships per company. Add a repository count (e.g. `countByCompanyId`) or a grouped
  query in the membership repository; map into the response DTO (`PlatformCompanyResponse`).
- Validate `plan` against the allowed set; validate `{id}` exists.

## Frontend (worktrack-frontend)

- **`platform/platformData.js`:** drop the localStorage `SEED` and `getPlatformCompanies`/`savePlatformCompanies`.
  Keep `PLANS` (pricing) and `computePlatformStats` (now fed real data). MRR = sum of `PLANS[plan].price`
  over active companies.
- **`PlatformAdminPage.jsx`:** fetch via React Query (`GET /platform/companies`), with `Array.isArray`
  guard; mutations for suspend/activate (`PUT …/status`) and plan change (`PUT …/plan`) that invalidate
  the query. Stats cards use `computePlatformStats` on the fetched list.
- Vite proxy: `/api/platform` is already covered by the catch-all `/api` → project-service (8085). No change.

## Data flow

```
Owner opens /platform → GET /api/platform/companies (owner-gated by verified email)
  → project-service: all companies + membership counts + plan
  → frontend renders table + computes MRR/stats from PLANS
Owner clicks Suspend  → PUT /status → isActive=false → list refetch
Owner changes plan    → PUT /plan   → plan updated   → MRR recomputes
```

## Error / edge

- Non-owner (normal ADMIN) hitting any `/api/platform/*` → **403** (verified server-side).
- Unknown `{id}` → 404; invalid `plan` → 400.
- Companies created before this feature have no `plan` → default `FREE`.
- `Array.isArray` guard on the fetch; empty list → existing empty state.

## Testing

- **Owner:** `/platform` shows real companies, real `userCount`, MRR from plans; suspend/activate flips
  status in DB; changing plan updates MRR.
- **Non-owner:** `curl /api/platform/companies` with a normal ADMIN token → 403.
- **Build:** project-service `mvn` compiles/starts; `npm run build` exits 0.

## Out of scope

- Scoping/fixing the separate `GET /api/companies` cross-tenant leak (tracked in SECURITY-AUDIT; do later).
- Billing/invoicing, plan enforcement (feature gating by plan), company creation from the console.
- Per-plan seat limits.
