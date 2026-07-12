# Self-Service Attendance (Check-in / Check-out) — Design

**Date:** 2026-07-12
**Feature:** Let each logged-in user mark their OWN attendance with one button, and see their live status — while HR keeps the existing admin table to mark/edit everyone.

## Problem / gap
Attendance backend logic (checkin/checkout, LATE-after-10am, HALF_DAY-under-4h, hours calc) already
exists and works **by `employeeId`**. The frontend is admin-style: an HR picks an employee from a
dropdown and marks them. There is **no self-service** — "I check *myself* in."

The token carries **email** (`X-User-Email`), but attendance works by **employeeId**. So we must map
the logged-in email → an employee record. There is currently no `/me` / by-email endpoint.

## Key concept
- **User (account)** = Google login identity; token has email only.
- **Employee (HR record)** = row in the Employees directory (name, dept, designation...).
- Link them by **email**. If the logged-in email has no matching employee row (e.g. the owner who
  signed up but never added themselves), self-attendance is not possible → show a friendly prompt.

## Decisions (locked with user)
1. **Layout:** Add a `My Attendance` card on top of the Attendance page; keep the admin table below.
2. **No-employee case:** Show a friendly prompt "You're not in the employee directory yet" + a
   button that navigates to the Employees page (user adds themselves). No auto-create, no hiding.
3. **Identity resolution = server-side (Approach B):** New `/me` self-endpoints resolve email→employee
   from the verified token; they never accept an `employeeId` from the client. This enforces "an
   employee can only mark themselves." Existing admin endpoints/table stay unchanged.

## Backend
### employee-service — `GET /api/employees/me`
Reads `X-User-Email` + `X-Company-Id` (both set by TenantFilter from the verified token), looks up
`findByEmailAndCompanyId`. Found → return `EmployeeResponse`; not found → **404**.

### attendance-service — `EmployeeClient.getMe()`
Calls employee-service `/me`, forwarding the incoming `Authorization` header (same pattern as the
existing `getEmployee`). Returns the employee for the current token, or signals not-found.

### attendance-service — 3 self endpoints (resolve identity from token; no `employeeId` in body)
| Endpoint | Behaviour |
|---|---|
| `GET  /api/attendance/me/today`   | `{ enrolled: bool, record: AttendanceResponse\|null }` |
| `POST /api/attendance/me/checkin` | Resolve email→employee, then reuse existing check-in logic |
| `POST /api/attendance/me/checkout`| Resolve email→employee, then reuse existing check-out logic |

`enrolled=false` when employee-service `/me` returns 404 → frontend shows the prompt.

## Frontend — `AttendancePage` → new `MyAttendanceCard` on top
New React Query on `GET /attendance/me/today`. Card states:
1. **Not enrolled** — prompt + "Add me as an employee" → navigates to `/employees`.
2. **Not checked in** — "Check In" button → `POST /attendance/me/checkin`.
3. **Checked in (live)** — show in-time + status; "Check Out" button → `POST /attendance/me/checkout`.
4. **Done for today** — show in/out/hours; "Done for today", no button.

Check-in/out mutations invalidate both `my-attendance` and `attendance-today` so the admin table below
updates immediately. Card shows the user's name from `wt_user` (localStorage). Admin table + dropdown
check-in stay as-is.

## Verification
- **Backend tests:** attendance-service — `me/checkin` resolves email→employee; `me/today` returns
  correct `enrolled` flag. employee-service — `/me` found/404.
- **Manual + Playwright:** all four card states + the "already checked in today" guard; confirm the
  admin table refreshes after a self check-in.

## Out of scope (YAGNI)
Geolocation/GPS, selfie, shift schedules, gamification XP on attendance, auto-create employee.
