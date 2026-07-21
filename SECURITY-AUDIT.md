# Security Audit — Taurus Go

**Date:** 2026-07-14
**Scope:** Full repo (7 Spring Boot services + api-gateway + config-server + React frontend).
**Verdict:** Great learning build, **not production-ready as-is.** The issues below (especially the
HIGH ones) must be fixed before any real go-live. Each item has: what, where (file:line), why it
matters, and the fix.

> Severity: **HIGH** = can be exploited to fully compromise data/accounts. **MEDIUM** = meaningful
> exposure or weakens defense. **LOW / NOTE** = hardening / good-practice.

---

## HIGH

### H1. JWT signing secret is hardcoded, committed to git, weak, and shared by all services
- **Where:** every `*/src/main/resources/application.yml` →
  `app.jwt.secret: worktrack-dev-secret-key-please-change-in-production-0123456789`
  (payroll:56, employee:47, leave:88, attendance:48, project:59, gamification:31, notification:62).
- **Why it matters:** The token is HS256-signed with this secret. Anyone who can read the repo can
  **forge a token for any company and any role (ADMIN)** and call every service. This is not
  theoretical — during debugging we minted a valid ADMIN token from this secret and it was accepted.
  One secret leak = the entire platform is compromised (multi-tenant isolation gone).
- **Fix:**
  1. Move the secret to an environment variable / secrets manager (`${JWT_SECRET}`), never commit it.
  2. Generate a strong random secret (≥ 32 random bytes) and **rotate** the current one.
  3. Consider **RS256** (private key signs in auth, services verify with public key) so a leaked
     verifier key can't mint tokens.
- **Status (2026-07-15): ROTATED — the committed value is now dead.**
  - The committed default was not just a fallback: `JWT_SECRET` was **unset**, so every service was
    actually running on the value in git. Anyone with repo read could mint an ADMIN token for any
    company — we did exactly that repeatedly while testing M5/M6.
  - New secret generated with `openssl rand -base64 48` (48 random bytes), stored in `.env`
    (gitignored) and exported as a Windows User-level env var.
  - **The default is gone**: every service now reads `secret: ${JWT_SECRET}` with no fallback, so an
    unset variable makes the service fail to start instead of silently using the old secret.
  - Verified: a token signed with the OLD secret is now rejected (401) by a restarted service.
  - Side effect (expected): rotation invalidated every issued token, logging all users out once.
- **Still open:** HS256 means every service holds the signing key, so any one service being
  compromised can mint tokens (see L4). RS256 — auth signs with a private key, services verify with a
  public one — remains the stronger design.

### H2. Database & broker passwords committed in plaintext
- **Where:** `employee-service` (:9 `password: 1230`), `gamification-service` (:12 `1230`),
  `project-service` (:9 `1230`); RabbitMQ `guest/guest` in most services; config-server (:15).
- **Why:** Real Postgres/broker credentials are in version control. Anyone with repo (or git history)
  access gets DB access. `1230` is also trivially weak.
- **Fix:** Externalize to env vars / secrets manager; use strong unique passwords; scrub from git
  history if the repo will ever be shared/public; never use `guest/guest` in prod.
- **Status (2026-07-14): partially addressed.** The Postgres `password` in employee/gamification/
  project now reads `${DB_PASSWORD:1230}` (env override). Still open: strong unique passwords per
  service, externalizing RabbitMQ `guest/guest`, and any credentials in `config-repo`.

### H3. Secrets live in git history even if removed now
- **Why:** Because H1/H2 were committed, deleting them from the current file is **not enough** — they
  remain in history. A leaked secret cannot be un-leaked; it can only be made **worthless**, and only
  rotation does that. History rewriting is housekeeping, not the fix — anyone who already cloned keeps
  the old objects either way.
- **Repo exposure (checked 2026-07-15):** `origin` is `github.com/vishalsharmabaddi/-hr-saas-microservices`
  and the GitHub API returns **404 unauthenticated**, i.e. the repo is **private**. So the historical
  secrets were exposed to repo collaborators, not the public — which is why rotation was enough and a
  history rewrite is not urgent. The old secret appears in **5 commits**.
- **Status (2026-07-15): JWT_SECRET rotated** (see H1). The old value is now useless.
- **Still open — rotate these too, same reasoning:**
  1. `DB_PASSWORD` — still `1230`. **Deferred by choice (2026-07-21):** this is the developer's local
     Postgres password, so rotating it means an `ALTER USER postgres PASSWORD ...` on the machine
     itself; left as-is for now. When rotated: change it in Postgres, update `.env`, then remove the
     `${DB_PASSWORD:1230}` fallback. `docker-compose.yml` now reads `POSTGRES_PASSWORD: ${DB_PASSWORD}`
     (committed `postgres` default removed).
  2. ~~RabbitMQ `guest/guest`~~ — **N/A (2026-07-21):** RabbitMQ/Spring Cloud Bus removed entirely
     (`spring-cloud-starter-bus-amqp` dropped from all poms, `rabbitmq` service removed from
     `docker-compose.yml`). Messaging is **Kafka**; no `guest/guest` credentials remain in the repo.
  3. ~~**`ENCRYPT_KEY`** committed default~~ — **FIXED (2026-07-21):** config-server now reads
     `encrypt.key: ${ENCRYPT_KEY}` with no committed default, and **all `{cipher}` values were removed**
     from `config-repo/*.yml` (replaced with `password: ${DB_PASSWORD}`, resolved by each service from
     its own env). With no ciphertext left to decrypt, the fake protection is gone. The `encrypt:`
     block is now effectively dead weight and can be dropped in a follow-up.
- **Before making this repo public:** rotate items 1-3 first, then optionally `git filter-repo` to
  scrub history. Rotation must come first — scrubbing a still-live secret protects nothing.

---

## MEDIUM

### M1. Actuator endpoints exposed with full details
- **Status (2026-07-15): FIXED.** Actuator now runs on a separate internal management port
  (`management.server.port` = app port + 1000) in all 7 services + config-server. The public app port
  serves **no** actuator at all. Also `show-details: never` (was `always`) and `info.env.enabled: false`
  (was `true`) everywhere.
- **Where (was):** every `application.yml` → `management.endpoints.web.exposure.include` on the app port,
  with `show-details: always`.
- **Why:** Everything below was reachable **unauthenticated** (TenantFilter deliberately skips
  `/actuator`). Proven live against project-service before the fix:
  - `POST /actuator/refresh` → **200** — anyone could trigger a config reload. On config-server,
    `busrefresh` broadcasts that to *every* service over the bus (a free DoS lever).
  - `GET /actuator/prometheus` → **344 lines** of metrics (Hikari pool size, JVM, URIs being hit).
  - `show-details: always` + `info.env.enabled: true` on attendance/leave/notification/payroll would
    have exposed component internals and config properties.
- **Verified after restart:** `:8085/actuator/{health,info,prometheus,refresh}` → **404** (incl. POST);
  `:9085/actuator/health` → **200** `{"status":"UP"}` with no details. App API still 200, M6 still 403,
  Eureka registration still UP, metrics still scrapeable on 9085.
- **Port map:** 8081→9081, 8082→9082, 8083→9083, 8084→9084, 8085→9085, 8086→9086, 8087→9087,
  config-server 8888→9888. `prometheus.yml` targets updated to match.
- **Deployment requirement:** these 90xx ports must stay off the public network (firewall / not routed
  by the gateway). The fix only relocates actuator — it does not authenticate it.
- **Known caveat:** `prometheus.yml` scrapes `host.docker.internal:90xx`, which assumes the services run
  on the host (the current workflow). If the app services are ever run from `docker-compose.yml`, the
  90xx ports are not published, so the targets would need to become container names (`employee-service:9081`).

### M7. Eureka registry and dashboard are public and unauthenticated
- **Status (2026-07-21): FIXED.** Eureka is now behind HTTP Basic auth. Added
  `spring-boot-starter-security` + a `SecurityConfig` requiring auth on every endpoint (CSRF disabled
  on the machine-to-machine `/eureka/**` API so client registration POSTs still work). Credentials come
  from `${EUREKA_USER}` / `${EUREKA_PASSWORD}` (no committed default — an unset var fails startup).
  Every client's `defaultZone` now embeds the credentials
  (`http://${EUREKA_USER}:${EUREKA_PASSWORD}@localhost:8761/eureka/`).
  - **Verified:** anonymous `GET /` → **401** (was 200, the leak); correct creds → **200**;
    wrong password → **401**.
- **Where (was):** `eureka-server` on :8761 — `GET /eureka/apps` and the web dashboard.
- **Why:** Returns the full service registry — every service's name, hostname, IP, port and status.
  That is an internal network map handed to an unauthenticated caller, and it is *not* actuator, so
  the M1 management-port fix does not cover it. Verified live: `GET /eureka/apps` → 200 with
  instanceId/hostName/ipAddr for project-service.
- **Fix:** Put Eureka behind basic auth (`spring.security.user.*` + `eureka.client.service-url.defaultZone`
  with credentials) and/or bind it to an internal network only. Same applies to the RabbitMQ, Kafka,
  Zipkin, Prometheus and Grafana consoles from `docker-compose.yml`.

### M2. JWT stored in browser `localStorage`
- **Where:** `worktrack-frontend/src/api/axios.js:19`, `LoginPage.jsx:27`, `Layout.jsx:174`,
  `SelectCompanyPage.jsx:26`, `OnboardingPage.jsx:44`, `AcceptInvitePage.jsx:21`, `useNotificationSocket.js:14`.
- **Why:** Any XSS on the site can read `localStorage` and exfiltrate the token (full account takeover).
  `httpOnly` cookies are not readable by JS and are safer for the token.
- **Fix:** Prefer an `httpOnly`, `Secure`, `SameSite` cookie for the token; keep a strict CSP; sanitize
  any user-rendered HTML. If keeping localStorage, treat XSS prevention as critical and keep token TTL short.

### M3. WebSocket handshake allows any origin
- **Status (2026-07-21): FIXED.** `/ws` now reads `app.cors.allowed-origins` (comma-separated,
  default `http://localhost:5173`) and uses `setAllowedOrigins(...)` for exact matching instead of
  `setAllowedOriginPatterns("*")`. Prod supplies the real domain(s) via config/env.
  - **Verified** against a running service: good origin (`localhost:5173`) → **200**;
    `evil.com` → **403** (was allowed under `*`); no-origin/non-browser → **200**.
- **Where (was):** `notification-service/.../config/WebSocketConfig.java:30` → `setAllowedOriginPatterns("*")`.
- **Why:** Any website can open a STOMP handshake to the service. Auth still requires a valid JWT on
  CONNECT (good), but `*` is too open for prod.
- **Fix:** Restrict to known frontend origin(s) in production.

### M4. TenantFilter turns every downstream error into 401 (logout)
- **Status (2026-07-15): FIXED** in all 7 services. `chain.doFilter(...)` now runs **outside** the
  try/catch; only token parsing is inside it. Invalid token still 401; a real app failure surfaces as
  its real 500. project-service compiles clean.
- **Follow-on:** this fix means real errors now actually reach the user, so the frontend gained an
  ErrorBoundary + 404 page (previously a crash = blank white page, and backend failures were hidden
  behind the 401→logout path). 2 Playwright tests cover it.
- **Where (was):** `*/security/TenantFilter.java` — `chain.doFilter(...)` was inside the `try`, and the
  `catch (Exception)` returned `401 Invalid token`.
- **Why:** Any controller/DB exception (a 500) is reported as 401 → the frontend clears the session and
  logs the user out (we hit exactly this with a leave-query bug). It also masks real errors and can aid
  an attacker in probing (everything looks like "auth failed").
- **Fix:** Only wrap the **token parse/verify** in try/catch. Call `chain.doFilter` **outside** the
  catch so downstream exceptions surface as their real status.

### M5. Platform Console uses mock data; real version needs strict owner-gating
- **Status (2026-07-15): ADDRESSED.** The Console now reads a real cross-tenant endpoint
  (`/api/platform/*` in project-service), gated by `PlatformGuard` — the verified `X-User-Email`
  (from the token, not the client) must be in `app.platform.owner-emails`. A normal company ADMIN
  gets **403**. Verified: owner 200, non-owner ADMIN 403 on list/status/plan; invalid plan 400.
- **Where (was):** `worktrack-frontend/src/platform/platformData.js` (localStorage `SEED`), used by
  `pages/PlatformAdminPage.jsx`.
- **Why:** A cross-tenant endpoint (list ALL companies, MRR, seats) reads **across tenants** and must
  be locked to the platform owner only — a normal company ADMIN must never reach it.
- **Fix applied:** owner-only backend endpoint verifying the platform-owner email from config; the
  client role is never trusted for cross-tenant reads.
- **Remaining:** owner list lives in config (`PLATFORM_OWNER_EMAILS`) — fine for now, but a real
  platform-owner claim/table is better once there is more than one owner.

### M6. `/api/companies` had no tenant scoping — cross-tenant READ *and WRITE* (was HIGH)
- **Status (2026-07-15): FIXED** in `CompanyController` + `CompanyService.getMyCompany`.
- **Where:** `project-service/.../controller/CompanyController.java`, `service/CompanyService.java`.
- **Why:** `getAllCompanies()` was a bare `findAll()`, and `getCompanyById/updateCompany` took the
  `{id}` straight from the URL with no ownership check. Classic IDOR / Broken Object Level
  Authorization (OWASP API Top 10 #1): authentication was enforced, authorisation was not.
- **Proven live** (2026-07-15) with a self-signed token for an **EMPLOYEE of company 999** against a
  running project-service:
  - `GET /api/companies` → **200**, returned every tenant.
  - `GET /api/companies/1` → **200**, another tenant's record.
  - `PUT /api/companies/1` → **200** — a low-privilege user of another tenant could rename/re-domain
    someone else's company. This was a cross-tenant **write**, not just a leak.
- **Root cause worth remembering:** `Company` has no `companyId` column — its own `id` IS the tenant
  id — so the habitual `findByCompanyId(...)` scoping used everywhere else never got applied here.
  Any table where the tenant id is the primary key deserves this same second look.
- **Fix:** `GET /companies` returns only the caller's own company (still a list, so the frontend's
  `companies[0]` contract is unchanged); `GET/PUT /companies/{id}` 403 unless `{id}` equals the
  token's companyId; `PUT`/`POST` additionally require ADMIN. `updateCompany` still copies only
  name/domain/logoUrl, so a tenant admin cannot flip `isActive` or self-upgrade `plan` — those stay
  Platform Console only.

---

## LOW / NOTES

### L1. Client sends `X-Company-Id` header (mitigated)
- `frontend/src/api/axios.js` sets `X-Company-Id` from localStorage. **Mitigation is in place:** every
  service's `TenantFilter` + `CompanyHeaderRequest` overrides these headers from the **verified token**,
  so the client value is ignored. Keep it that way — the safety depends on *every* service having the
  filter (all 7 currently do). Any new service must include it.

### L2. No auth rate-limiting (brute force / abuse)
- **Status (2026-07-21): FIXED.** `project-service` gained `AuthRateLimitFilter` — a **per-IP**
  Bucket4j limiter on `/api/auth/**` (default **10 requests / 60s** per IP, tunable via
  `app.rate-limit.auth.*`). Over the limit → **429** + `Retry-After`. Per-IP means an abusive IP is
  throttled while legitimate users are unaffected; greedy refill returns a token every ~6s so a real
  user is not locked out for long. Client IP = first `X-Forwarded-For` entry (behind a proxy) else
  `getRemoteAddr()`.
  - **Verified** against a running service: requests 1-10 → 401 (passed through), 11-12 → **429**;
    the 429 carries `Retry-After: 60`.
  - **Note:** buckets are in-memory, correct for a single instance. If project-service is scaled out,
    move them to a shared store (e.g. Redis) so the limit holds across instances.
- **Was:** resilience4j rate-limiters exist for some inter-service calls but not for login/auth.

### L3. Gateway validates JWT, but dev bypasses the gateway
- `api-gateway/SecurityConfig.java` enforces `anyRequest().authenticated()` + JWT. In dev the frontend
  hits services **directly via Vite proxy**, bypassing the gateway. Services are still protected by their
  own TenantFilter, but ensure prod traffic is forced through the gateway (or a mesh) and services aren't
  publicly reachable.

### L4. HS256 shared secret couples all services
- All services verify with the same symmetric secret, so any one service leaking it compromises all.
  Asymmetric keys (RS256) reduce blast radius. Ties into H1.

### L5. System/service-account token (attendance scheduler)
- `attendance-service/.../JwtService.signSystemToken()` mints a short-lived (2 min) ADMIN token for the
  nightly job. Acceptable, but it inherits the shared-secret risk (H1/H4). Keep the TTL short (done) and
  scope it minimally.

### L6. No TLS/HTTPS configured
- Everything runs on plain `http` in dev. In prod, terminate TLS everywhere (tokens and data must not
  travel in cleartext).

### L7. Verify auth password handling
- Auth appears to use Google OAuth (by design). Confirm there is **no** plaintext-password login path
  anywhere; if any local password is stored, it must be BCrypt-hashed.

---

## Priority order before go-live
1. **H1 + H2 + H3** — externalize & rotate all secrets/passwords (blocking).
2. ~~**M4** — fix the TenantFilter error masking (correctness + probing).~~ **Done (2026-07-15).**
3. ~~**M6** — scope `/api/companies` to the caller's tenant (cross-tenant read *and write*).~~ **Done (2026-07-15).**
4. ~~**M1** — lock down actuator.~~ **Done (2026-07-15)** — moved to internal management ports.
5. ~~**M7** — put Eureka behind auth / internal-only.~~ **Done (2026-07-21)** — HTTP Basic auth on the
   registry + dashboard. (The Kafka/Zipkin/Grafana consoles from `docker-compose.yml` should still be
   bound internal-only in prod.)
6. **M2 / M3 / L2 / L6** — token storage, CORS, rate limiting, TLS.
7. ~~**M5** — design the platform-owner gate before building the real Platform Console.~~ **Done (2026-07-15).**

*This audit is a snapshot; re-run after fixes and whenever a new service or public endpoint is added.*
