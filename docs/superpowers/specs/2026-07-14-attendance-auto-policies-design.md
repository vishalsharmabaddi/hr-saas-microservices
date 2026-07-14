# Attendance Auto-Policies — Design Spec

**Date:** 2026-07-14
**Feature:** Per-company work-schedule policy that drives attendance status (PRESENT / LATE /
HALF_DAY), plus a scheduled job that auto-marks absentees. Replaces the currently hardcoded rules.

## Motivation / current state

Status rules are hardcoded in **attendance-service**:
- `AttendanceRecord.@PrePersist`: `checkInTime.getHour() >= 10 → LATE` (fixed 10:00).
- `AttendanceService` checkout: `minutesWorked < 240 → HALF_DAY` (fixed 4h).
- **ABSENT is never set** (absent = no record). No `@Scheduled` job exists.

Different companies have different hours (9–6, 9–5, Mon–Fri vs Mon–Sat), so the rules must be
per-company configuration, not constants.

## Decisions (locked with user)

- New **`CompanyAttendancePolicy`** in attendance-service, mirroring the existing
  `CompanyPayrollPolicy` pattern (get-with-default + upsert).
- Auto-absent runs as **a single daily cron at ~23:00** for all companies (not per-company end-time).
- Half-day is decided by **hours worked < `halfDayHours`** (existing logic, now configurable).
- The scheduler authenticates to employee-service using a **self-signed system JWT** per company
  (service-account pattern) — attendance-service gains a sign capability alongside its verify.

## 1. `CompanyAttendancePolicy` (attendance-service)

Model (unique `companyId`):

| Field | Type | Default |
|---|---|---|
| `companyId` | Long (unique) | — |
| `workStartTime` | LocalTime | `09:00` |
| `workEndTime` | LocalTime | `18:00` |
| `graceMinutes` | int | `15` |
| `halfDayHours` | int | `4` |
| `workingDays` | String (CSV) | `MON,TUE,WED,THU,FRI` |

- `repository/CompanyAttendancePolicyRepository` — `findByCompanyId`.
- `service/AttendancePolicyService` — `getPolicy(companyId)` returns saved or an in-memory default;
  `savePolicy(companyId, request)` upsert.
- `dto/AttendancePolicyRequest`.
- Controller: `GET /api/attendance/policy`, `PUT /api/attendance/policy` — **ADMIN only** (role from
  `X-User-Role` header; add a small guard like payroll's `RoleGuard`).

## 2. Status decision moves to the service layer

The `@PrePersist` in `AttendanceRecord` cannot see the policy, so status logic moves to
`AttendanceService`:

- **check-in:** load policy; `checkInTime > workStartTime + graceMinutes` → `LATE`, else `PRESENT`.
- **check-out:** `hoursWorked < halfDayHours` → `HALF_DAY` (was fixed 240 min).
- Remove the hardcoded hour/minute rules from the entity (keep entity default `PRESENT` as fallback).

## 3. `@Scheduled` auto-absent job

- `@EnableScheduling` on the application; new `scheduler/AttendanceScheduler`.
- `@Scheduled(cron = "0 0 23 * * *")` — daily 23:00 (server time).
- Algorithm:
  1. Get distinct `companyId`s that have a policy configured (from `CompanyAttendancePolicy`).
  2. For each company: if **today is not a working day** per `workingDays`, skip.
  3. Mint a **system JWT** (`{ companyId, role: ADMIN, sub: "system" }`, short expiry) signed with
     the shared secret; call employee-service `GET /api/employees` with it to get the active roster.
  4. For each active employee with **no attendance record today**, create one with status `ABSENT`
     (skip if a record already exists — idempotent).
- **System-token / service-account rationale:** a background job has no incoming request to forward a
  user token from, so it presents its own identity. attendance-service already verifies JWTs with the
  shared secret; add a `sign(companyId)` helper to `JwtService` using the same key.
- Manual trigger for testing: a guarded internal endpoint (e.g. `POST /api/attendance/run-absent-check`,
  ADMIN only) that runs the same routine for the caller's company, so we don't have to wait for 23:00.

## 4. Settings UI (worktrack-frontend)

- An **Attendance Policy** section (in `SettingsPage`, ADMIN only) — inputs for start/end time
  (`type="time"`), grace minutes, half-day hours, and working-days checkboxes.
- `GET /api/attendance/policy` to load, `PUT` to save (React Query mutation + invalidate).
- Array/guard conventions as usual.

## 5. Payroll synergy

Payroll LOP already counts `ABSENT` records, so auto-absent records automatically flow into payslip
loss-of-pay — no payroll change needed.

## Testing

- **Policy-driven status:** set start 09:00/grace 15 → check-in 09:20 = LATE, 09:10 = PRESENT.
  Set halfDayHours 4 → checkout with <4h worked = HALF_DAY.
- **Auto-absent:** trigger the manual endpoint; an active employee with no record today gets ABSENT;
  running again does not duplicate; a non-working-day is skipped.
- **System token:** the scheduler's employee-service call succeeds without any user request in context.
- **Payroll:** a payroll run after auto-absent reflects the new ABSENT days in LOP.
- **Build:** attendance-service `mvn` compiles/starts; `npm run build` exits 0.

## Out of scope

- Per-company end-time dynamic scheduling (single daily cron chosen).
- Timezone-per-company (server-time cron for now).
- Overtime, shift rotations, biometric integration.
- Holiday calendar (working-days handles weekly off; public holidays are a later feature).
