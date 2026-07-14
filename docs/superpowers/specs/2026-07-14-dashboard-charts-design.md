# Dashboard Charts — Design Spec

**Date:** 2026-07-14
**Feature:** Add at-a-glance visual charts to the main Dashboard (`/dashboard`), which currently
shows only numeric stat cards and lists. Keep the deep `/analytics` page unchanged (no duplication).

## Decisions (locked with user)

- Enrich the **main Dashboard** (not the Analytics page).
- Add **two donut charts**, both from **existing data — no new backend endpoint**:
  1. **Task Status donut** — Open / In Progress / Completed.
  2. **Today's Attendance gauge** — Present vs Absent (Admin/Manager only).

## Data sources (already fetched in DashboardPage)

| Chart | Source |
|---|---|
| Task Status donut | `/dashboard/summary` → `openTasks`, `inProgressTasks`, `completedTasks` |
| Today's Attendance gauge | `attendance/today` (present count) + `employees` (active count); Absent = `max(0, active − present)` |

## Charts

**1. Task Status donut** (all roles — Projects visible to everyone)
- Recharts `PieChart` with `innerRadius` (donut).
- Colors match existing stat-card accents: Open `#d97706`, In Progress `#0284c7`, Completed `#16a34a`.
- Center label: total tasks. Tooltip + legend.
- Empty state: total 0 → "No tasks yet".

**2. Today's Attendance gauge** (Admin/Manager only — mirrors HR stats gating)
- Donut: Present `#16a34a` vs Absent `#cbd5e1`.
- Center label: `present / active` (e.g. `7 / 10`).
- Empty state: active employees 0 → "No employees yet".

## Layout / placement

New **chart row** inserted **below the HR Overview stat cards** and **above** the Recent
Projects / Logs row:
- Admin/Manager: two-column grid → `[ Task donut | Attendance gauge ]`.
- Employee: single Task donut card (attendance is HR-only).
- Responsive: stacks to one column on narrow widths (reuse existing grid breakpoints).

## Code structure

- **New file `src/components/DashboardCharts.jsx`** — presentational only. Props:
  `{ openTasks, inProgressTasks, completedTasks, todayPresent, activeEmployees, isManager, loading }`.
  Renders the chart row; internally decides which cards to show based on `isManager`.
  (DashboardPage is already large; isolating charts keeps it readable.)
- **`src/pages/DashboardPage.jsx` edit** — import and render `<DashboardCharts ... />` with the
  already-computed values (`data.openTasks`, `todayAttendance`, `activeEmployees`, `user.role !== 'EMPLOYEE'`).
  No new API call.

## Error / edge handling

- Existing `Array.isArray` guards remain on all queries.
- Loading → "Loading…" placeholder in each card.
- Absent never negative → `Math.max(0, active − present)`.
- Follow the **dataviz** skill when writing chart code (color/contrast, legend, tooltip, empty states).

## Testing

- **Manual:** open `/dashboard` → two donuts render; segment values match the stat-card numbers.
  Employee login → only the Task donut shows. Zero-data → empty states.
- **Build:** `npm run build` exits 0.

## Out of scope

- No changes to the `/analytics` page.
- No new backend endpoints or aggregation.
- Date-range filtering is a separate feature (its own spec).
