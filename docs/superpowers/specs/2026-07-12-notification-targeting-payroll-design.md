# Real-way Notifications: per-user targeting + payroll payslip notification

Date: 2026-07-12
Status: Approved

## Context

The in-app notification center already exists and works: notification-service
consumes Kafka events (`leave-approved`, `invite-created`, `employee-nudge`),
stores `Notification` rows, and exposes REST (list, unread count, mark read,
mark-all). The frontend has a header bell (unread badge + dropdown) and a full
`/notifications` page (polling, mark read).

Two gaps make it not "real software" yet:
1. **No targeting** — `getAll(companyId)` returns *every* notification in the
   company to *every* user. Notifications should be per-recipient.
2. **Payroll is silent** — generating a payslip produces no notification.

## Decisions

- Notifications become **per-recipient by email** (`recipientEmail`). The
  recipient email comes from the verified token (`X-User-Email` header set by
  TenantFilter) — no extra service call.
- `recipientEmail = NULL` means **broadcast** (visible to everyone in the
  company). This keeps any legacy rows visible and is a safe default.
- Payroll publishes a Kafka `payslip-generated` event; notification-service
  consumes it and creates a **targeted** notification for that employee
  (salary is private → must not be broadcast).
- Frontend plays a short sound (`src/assets/notification.mp3`) when a new
  notification arrives (unread count increases). Browser autoplay only works
  after the user's first interaction — acceptable.
- **No SendGrid / email needed.** In-app bell only. (EmailService already
  exists via JavaMailSender and degrades to logging without SMTP.)

## Chunk A — Per-user targeting (notification-service + leave-service + frontend)

**notification-service**
- `Notification`: add `recipientEmail` (nullable String).
- `NotificationService`:
  - `saveNotification(...)` gains a `recipientEmail` param.
  - `getForUser(companyId, email)` → rows where `companyId` matches AND
    (`recipientEmail = email` OR `recipientEmail IS NULL`), newest first.
  - `unreadCount`, `markAllRead` scoped the same way.
  - `markAsRead(id)` keeps company scope (+ recipient check).
- Repository: add the filtered finder / count / (email or null) queries.
- `NotificationController`: read `@RequestHeader("X-User-Email")` and pass it
  to list / unread-count / mark-all.
- Existing consumers (Leave, Invite, Nudge) pass a recipientEmail (null where
  unknown → stays broadcast).

**leave-service (targeting for leave approvals)**
- `LeaveApprovedEvent` (+ producer) carries `recipientEmail` = the applicant's
  email. `LeaveService.approveLeave` already fetches the employee for the name;
  also read the email there. Null-safe: if email missing, broadcast.

**frontend**
- No API change (same endpoints; backend now filters). Verify bell + page still
  work and show only the current user's + broadcast notifications.

## Chunk B — Payroll event + payslip notification + sound

**payroll-service**
- Add `spring-kafka`. `PayslipEventProducer.send(payslip)` publishes JSON to
  topic `payslip-generated` on a background thread (graceful if Kafka down),
  mirroring `LeaveEventProducer`.
- Event fields: companyId, employeeId, employeeName, recipientEmail, month,
  year, netPay, message ("Your payslip for <Month Year> is ready — net pay ₹X").
- `EmployeeClient.EmployeeInfo` gains `email` so the producer can target.
- `PayslipService.generate(...)` fires the event after each save.

**notification-service**
- `PayslipEventConsumer` `@KafkaListener(topics = "payslip-generated")` →
  `saveNotification(..., type = "PAYSLIP_GENERATED", recipientEmail = <employee>)`.
- `PayslipGeneratedEvent` DTO.

**frontend**
- `NotificationsPage` + bell dropdown: add `PAYSLIP_GENERATED` badge style;
  clicking a payslip notification navigates to `/my-payslips`.
- Sound: in the bell component, track previous unread count; when it increases,
  `new Audio(notificationSound).play()` (best-effort, catch autoplay errors).

## Out of scope (future)

- Email/push channels (Gmail SMTP is the free path if wanted later; no SendGrid).
- Targeting other events (attendance, tasks) — same pattern when needed.
- Per-notification deep-links beyond payslip.

## Testing

Each chunk: backend curl (with a real token) + manual browser. Kafka must be
running for events; producers degrade gracefully if it is down. User runs the
services (`mvn spring-boot:run`); Claude does not run them. New Kafka topics are
auto-created on first send (or pre-created by the user).
