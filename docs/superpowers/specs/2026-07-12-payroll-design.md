# Payroll / Payslip Module — Design

Date: 2026-07-12
Status: Approved (brainstorming complete)

## Purpose

Let a company run monthly payroll and produce per-employee payslips (a PDF
breakdown of earnings, deductions and net take-home). Employees can view and
download their own payslips; admins/managers generate and view all of them.

## Key decisions (locked with user)

1. **New `payroll-service`** (port 8087), own PostgreSQL DB, registered on
   Eureka + routed via api-gateway. Mirrors the existing microservice pattern.
2. **Standard payslip detail:** earnings = Basic + HRA + Special Allowance;
   deductions = PF (12% of basic), Professional Tax (flat), LOP (loss of pay).
3. **Flexible salary structure per employee** — deduction components can be
   toggled off / zero, so a contractor/intern gets `netPay = grossPay`
   (nothing deducted).
4. **Monthly, per-employee run:** admin picks month + year + an employee (or
   "all"), presses Run; payslips are computed and saved. Saved records, not
   on-the-fly only.
5. **Access:** admin/manager generate + view all; each employee sees their own
   payslips via token-resolved identity (same pattern as self-attendance).
6. **Company-level paid-leave quota** (`paidLeavesPerMonth`) — each company sets
   its own; multi-tenant. Approved leaves within the quota are paid; beyond it
   they become LOP.
7. **Leave-type scope (YAGNI):** payroll ignores the leave *type* name — all
   APPROVED leave days in the month count toward the quota. A full Leave Policy
   Management module (per-type quotas, accrual, carry-forward) is a **separate,
   later** project.

## Architecture

```
  Admin / Employee (browser)
          │  JWT (gateway verifies, injects X-Company-Id / X-User-Email / X-User-Role)
          ▼
   payroll-service :8087  ── PostgreSQL (payroll DB)
     │        │        │
     │        │        └── GET /api/leaves/employee/{id}     → leave-service  :8083
     │        └─────────── GET /api/attendance?from=&to=     → attendance-service :8082
     └──────────────────── GET /api/employees , /employees/me → employee-service :8081
```

Inter-service calls use `RestClient`, forwarding the incoming `Authorization`
header (same approach as attendance-service's `EmployeeClient`). No changes are
needed in employee/attendance/leave services — existing endpoints are reused.

## Data model (payroll DB)

**`company_payroll_policy`**
| field | type | notes |
|---|---|---|
| id | Long | PK |
| companyId | Long | unique per company |
| paidLeavesPerMonth | int | e.g. 2 (0 = no paid leave) |

**`salary_structures`**
| field | type | notes |
|---|---|---|
| id | Long | PK |
| companyId | Long | tenant |
| employeeId | Long | unique with companyId |
| basic | BigDecimal | monthly ₹ |
| hra | BigDecimal | monthly ₹ |
| specialAllowance | BigDecimal | monthly ₹ |
| pfEnabled | boolean | PF 12% of basic if true |
| professionalTax | BigDecimal | flat ₹ deduction (0 = none) |
| lopEnabled | boolean | deduct pay for LOP days if true |

**`payslips`** (snapshot at generation time so later structure edits don't alter history)
| field | type |
|---|---|
| id | Long |
| companyId | Long |
| employeeId | Long |
| month | int (1-12) |
| year | int |
| basic, hra, specialAllowance, grossPay | BigDecimal |
| pf, professionalTax | BigDecimal |
| absentDays, approvedLeaveDays, paidLeaveDays, unpaidLeaveDays, lopDays | int |
| lopAmount, totalDeductions, netPay | BigDecimal |
| generatedAt | LocalDateTime |

Unique constraint: `(companyId, employeeId, month, year)` — one payslip per
employee per month (re-run overwrites).

## Calculation

```
grossPay          = basic + hra + specialAllowance
pf                = pfEnabled ? round(basic * 0.12) : 0
absentDays        = count of ABSENT attendance records in the month   (attendance-service)
approvedLeaveDays = sum of totalDays of APPROVED leaves in the month   (leave-service)
paidLeaveDays     = min(approvedLeaveDays, company.paidLeavesPerMonth)
unpaidLeaveDays   = max(0, approvedLeaveDays - paidLeavesPerMonth)
lopDays           = absentDays + unpaidLeaveDays
lopAmount         = lopEnabled ? round(grossPay / 30 * lopDays) : 0
totalDeductions   = pf + professionalTax + lopAmount
netPay            = grossPay - totalDeductions
```

Simplifications (acceptable for this learning project):
- LOP per-day uses a fixed 30-day divisor.
- "Absent" = attendance records with status `ABSENT` in the month (no-record /
  weekend days are not counted).
- Approved leaves are matched to the month by falling within it; multi-month
  spanning leaves are counted by their recorded `totalDays` (edge case ignored).

## API endpoints (payroll-service, base `/api/payroll`)

Admin / Manager:
- `GET  /policy` — get company paid-leave policy (defaults if unset)
- `PUT  /policy` — set `paidLeavesPerMonth`
- `GET  /structure/{employeeId}` — get an employee's salary structure
- `PUT  /structure/{employeeId}` — create/update salary structure
- `POST /run` — body `{ month, year, employeeId | "all" }` → generate + save payslip(s)
- `GET  /payslips?month=&year=` — list payslips for the company (optionally filtered)

Employee self (identity from token):
- `GET  /me/payslips` — my payslips (most recent first)
- `GET  /me/payslips/{id}` — one payslip (guarded to owner)

RBAC: mutating + all-company reads require ADMIN/MANAGER (RoleGuard). `/me/*`
requires an authenticated user resolved to an employee.

## Frontend

- **`/payroll`** (ADMIN, MANAGER): company paid-leave policy setting; salary
  structure editor (pick employee → fill components → save); "Run Payroll"
  (month/year + employee or all → Generate); table of generated payslips with
  a per-row Download PDF.
- **`/my-payslips`** (every authenticated employee): list of own payslips →
  Download branded PDF.
- **PDF:** reuse the branded Taurus Go letterhead helper from
  `utils/exportReport.js`; add a payslip layout (earnings/deductions two-column
  breakdown + net pay highlight). CSV not required for payslips.
- Nav item(s) + route guards + `ROLE_NAV` entries added.

## Out of scope (future, separate modules)

- Leave Policy Management: leave types, per-type annual quota, accrual,
  carry-forward.
- Income-tax slab computation.
- Scheduled automatic monthly payroll run.

## Testing

Each layer: Playwright automated + manual browser steps. Backend services are
started by the user (`mvn spring-boot:run`); Claude does not run commands.
New service requires the user to restart / start payroll-service and ensure its
DB exists.
