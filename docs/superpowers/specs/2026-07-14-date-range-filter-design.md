# Date Range Filter — Design Spec

**Date:** 2026-07-14
**Feature:** A reusable From/To date-range filter (with quick presets) so users can view/export a
specific period's data. Applied to **Leaves**, **Reports**, and **Attendance**.

## Motivation / current gaps

- **Leaves page** — only status tabs (All/Pending/Approved/Rejected); no way to view a specific month.
- **Reports page** — From/To date inputs exist, but the **leave** report ignores them (backend
  `GET /leaves` only accepts `status`) — a real bug: leave export always returns everything.
- **Attendance page** — shows **today only** (`/attendance/today`, `/attendance/me/today`); no way
  to view a past day/month.
- **Time Logs page** — already has week/month range navigation → **left unchanged**.

## Decisions (locked with user)

- Filter style: **From/To date range + quick presets** (not a month dropdown) — consistent with the
  existing Reports From/To, fully flexible.
- **Cross-year / multi-year supported.** Free date inputs allow any range (e.g. Jan 2024 → Dec 2025).
  Presets include **This year** and **Last year**. Only limited by data present in the DB — matching
  how real HR/payroll software supports historical (audit/year-end) pulls.
- Include **Attendance** history view in this feature (not deferred).

## 1. Reusable component — `src/components/DateRangeFilter.jsx`

Presentational, controlled component.
- **Props:** `{ from, to, onChange }` where `onChange({ from, to })` fires on any change.
- **UI:** two `<input type="date">` (From, To) + preset buttons:
  **This month · Last month · Last 30 days · This year · Last year**.
- Preset click computes ISO `from`/`to` (`YYYY-MM-DD`) and calls `onChange`.
- Small pure date helpers (firstOfMonth, lastOfMonth, etc.) kept local to the component.
- Guards: if `from > to`, still emit (caller/UI shows empty result); no crash.

## 2. Leaves

**Backend — leave-service `GET /leaves`:**
- Add optional `@RequestParam LocalDate from`, `@RequestParam LocalDate to` (both `required = false`).
- `LeaveService.getAllLeaves(companyId, status, from, to)` — filter by `startDate` within `[from, to]`
  (inclusive) when provided; combine with existing `status` filter.
- Repository: add a query/derived method filtering by `companyId` + optional `startDate BETWEEN`.
  Simple approach: fetch by company (+status) then filter `startDate` in-range, OR a `@Query` with
  nullable params. Prefer a `@Query` with `(:from IS NULL OR startDate >= :from)` style for both bounds.

**Frontend — `LeavePage.jsx`:**
- Add `from`/`to` state, default = **this month**.
- Render `<DateRangeFilter from={from} to={to} onChange={...} />` near the status tabs.
- Pass `from`/`to` (plus existing `status`) as query params; include them in the React Query `queryKey`.
- Keep `Array.isArray` guard. Empty range → existing empty-state message.

## 3. Reports

**Frontend — `ReportsPage.jsx`:**
- Replace the inline From/To inputs with the shared `<DateRangeFilter>` (presets now available here too).
- **Bug fix:** for `type === 'leave'`, pass `from`/`to` to `/leaves` (currently only `status` is sent).
- Attendance report already sends `from`/`to` — unchanged. Employee report has no dates — unchanged.
- Export (CSV/PDF) already builds from the fetched rows, so it inherits the filtered range automatically.

## 4. Attendance (history view)

**Frontend — `AttendancePage.jsx`:**
- Add a **"History"** section below the existing today flow: a `<DateRangeFilter>` (default = this month)
  + a read-only list/table of records from `/attendance?from&to` (endpoint already exists — **no backend change**).
- The today check-in/out self-service flow stays exactly as-is.
- Admin/Manager see all employees' records in range; keep role behavior consistent with the existing page.
- `Array.isArray` guard on the range query.

## Backend change summary

Only **leave-service** changes (`from`/`to` params on `GET /leaves`). Attendance `?from&to` and the
Reports flow already exist.

## Testing

- **Leaves:** default this-month shows current month; "Last month" preset → previous month; "Last year"
  → full previous year; cross-year custom From/To works; status + date combine.
- **Reports:** leave type + range → export contains only that range's leaves (previously all); switching
  presets updates the table and the export.
- **Attendance:** pick a past month in History → that month's records; today flow unaffected.
- **Build:** `npm run build` exits 0; leave-service rebuilt with `mvn` and restarted.

## Out of scope

- Time Logs page (already has range navigation).
- Saved/named filter presets, URL-persisted filters.
- Timezone handling beyond the existing ISO `YYYY-MM-DD` convention.
