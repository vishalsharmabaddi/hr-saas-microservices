# Real-time Notifications (WebSocket / STOMP) — Design Spec

**Date:** 2026-07-14
**Feature:** Upgrade the notification bell from 15s HTTP polling to instant server-push over WebSocket (STOMP), while keeping polling as a fallback.

## Goal

When a notification is created (payslip generated, leave approved, nudge), push it to the
target user's browser **instantly** (<1s) instead of waiting up to 15s for the next poll.
Toast + sound should fire the moment the notification lands.

## Decisions (locked with user)

1. **STOMP over WebSocket** (not raw WebSocket) — Spring built-in `@EnableWebSocketMessageBroker`,
   easy per-user targeting via `convertAndSendToUser`.
2. **WebSocket primary + polling fallback** — polling stays but interval bumped 15s → 60s as a
   safety-net if the socket drops.
3. **JWT on connect → secure per-user targeting** — client sends `Authorization: Bearer <jwt>` in
   the STOMP CONNECT frame; backend verifies it and binds the session to the user's email. No public
   name-based channels.

## Architecture

WebSocket endpoint lives on **notification-service (:8084)** — where notifications are created.
Frontend connects directly via the Vite dev proxy (not through the gateway), matching the existing
per-service proxy pattern.

```
Browser ──(SockJS / STOMP over ws)──► notification-service :8084  /ws
```

## Backend components (notification-service)

| Component | Responsibility |
|---|---|
| `spring-boot-starter-websocket` (pom.xml) | WebSocket + STOMP support |
| `config/WebSocketConfig` | Register `/ws` SockJS endpoint; broker prefixes: app `/app`, broker `/topic` + `/queue`, user `/user`; register `AuthChannelInterceptor` on client inbound channel |
| `security/StompPrincipal` | Minimal `java.security.Principal` holding the user's email as `getName()` |
| `security/AuthChannelInterceptor` | On STOMP `CONNECT`, read `Authorization: Bearer <jwt>`, verify via existing `JwtService`, set `accessor.setUser(new StompPrincipal(email))`. Reject connect if token missing/invalid. |
| `security/TenantFilter` (edit) | Add `/ws` to the skip-list — the SockJS HTTP handshake carries no Bearer header; auth happens in the STOMP CONNECT frame instead. |
| `service/NotificationService` (edit) | Inject `SimpMessagingTemplate`; after `save`, push: **targeted** (recipientEmail != null) → `convertAndSendToUser(email, "/queue/notifications", dto)`; **broadcast** (null) → `convertAndSend("/topic/company." + companyId, dto)` |

Push payload = the existing `NotificationResponse` (reuse `toResponse`). Push is best-effort: wrap
in try/catch so a socket failure never breaks the DB save / Kafka flow.

## Frontend components (worktrack-frontend)

| Component | Responsibility |
|---|---|
| `@stomp/stompjs` + `sockjs-client` (npm) | STOMP client libraries |
| `vite.config.js` (edit) | Proxy `/ws` → `http://localhost:8084` with `ws: true` |
| `hooks/useNotificationSocket.js` (new) | On login: connect STOMP over SockJS to `/ws` with `connectHeaders: { Authorization: 'Bearer ' + token }`; on connect subscribe `/user/queue/notifications` + `/topic/company.{companyId}`; on message → `queryClient.invalidateQueries(['notifications'])`; `reconnectDelay: 5000`; on unmount/logout `client.deactivate()` |
| `components/Layout.jsx` (edit) | Call the hook; bump both `refetchInterval: 15000 → 60000` (main + dropdown) |

**Reuse:** on a WS message the hook only invalidates the React Query cache → refetch → the existing
`prevUnread` effect (already in Layout) fires toast + sound automatically. No new toast/sound code.

`companyId` for the broadcast topic is read from the stored user (`wt_user` in localStorage / token claim).

## Data flow (end-to-end)

```
payroll RUN → Kafka(payslip-generated) → notification-service consumer
  → NotificationService.saveNotification(...)
       ├─ save to DB
       └─ convertAndSendToUser(email, /queue/notifications, dto)
             └─(WebSocket)→ user's browser (subscribed) → invalidate query → refetch
                   → unread++ → toast + sound 🔔 (instant)
```

## Error handling / robustness

- **Socket drops** → 60s polling still fetches; stompjs auto-reconnects (5s).
- **Token expired/invalid on connect** → interceptor rejects CONNECT; no push, but polling (axios auth) keeps working.
- **Kafka down** → producer already graceful (unchanged).
- **Push throws** → caught; DB save + Kafka ack unaffected.

## Testing

- **Manual (two tabs):** admin runs a payslip / approves a leave in one tab; the target employee's
  tab shows toast + sound **instantly** (no 15–60s wait).
- **Network:** DevTools → Network → `/ws` request shows `101 Switching Protocols` (or SockJS info + ws frame).
- **Fallback:** stop notification-service, confirm polling still surfaces notifications after restart.

## Out of scope

- Presence / "user online" indicators.
- Typing indicators, chat, read-receipts sync across devices.
- Pushing through the API gateway (kept on the direct per-service proxy pattern for now).
