# project-service — Design Spec
**Date:** 2026-07-05  
**Module:** A (WorkTrack Core)  
**Status:** Approved, ready to implement

---

## Goal

Build `project-service` — WorkTrack ka core microservice jo Projects, Tasks, Time Logs (EOD), Milestones, aur Issues handle karega. Zoho Projects se better: workload report FREE, EOD reports built-in, AI summaries aur gamification ke liye ready.

---

## What We're Building (Scope)

```
project-service
  ├── Company          → multi-tenancy (har company ka data alag)
  ├── Project          → client ya department project (flexible)
  ├── TaskList         → project ke andar categories
  ├── Task             → individual kaam with full details
  ├── TimeLog          → daily hours + notes = EOD Report (merged)
  ├── Milestone        → project phases
  ├── Issue            → blockers/bugs tracker
  └── ProjectMember    → role per project
```

---

## Architecture

```
React Frontend
      │  JWT (Keycloak)
      ▼
API Gateway :8222
      │
      └──► project-service :8085  (NAY SERVICE)
                │
                ├── PostgreSQL: project_db
                │
                ├── OpenFeign → employee-service :8081
                │               (user naam/email fetch)
                │
                └── Kafka → notification-service
                            (task assign hone pe alert)

Supporting (already built):
  Keycloak  :8080   → Auth + Google OAuth
  Eureka    :8761   → Service Discovery
  Config    :8888   → Centralized Config
  Zipkin    :9411   → Distributed Tracing
  Grafana   :3000   → Monitoring
```

**Port:** `8085`  
**Service name (Eureka):** `project-service`  
**DB:** `project_db` (PostgreSQL, alag schema)

---

## Multi-Tenancy

- Strategy: **Shared Database, Tenant-per-Row**
- Har table me `company_id` column hoga
- JWT me `company_id` custom claim hoga (Keycloak se)
- Service har request me `company_id` JWT se extract karegi, sirf usi company ka data return karegi
- Company A ka data Company B ko kabhi nahi dikhega

```
JWT payload example:
{
  "sub": "user-uuid",
  "company_id": "abc-123",
  "project_role": "PROJECT_MANAGER",
  "email": "vishal@company.com"
}
```

---

## Auth — Google OAuth

- Keycloak already setup hai (Chunk 44)
- Google ko Keycloak ke andar **Identity Provider** banayenge
- Steps:
  1. `console.cloud.google.com` pe OAuth 2.0 Client ID banao
  2. Keycloak Admin Panel → Identity Providers → Google → Client ID + Secret paste karo
  3. Done — "Continue with Google" button kaam karega
- App ko Google se seedha koi kaam nahi — sirf Keycloak JWT handle karega

---

## Roles (3 types, per project)

| Role | Kya kar sakta hai |
|---|---|
| `PROJECT_MANAGER` | Project create/edit, tasks assign, members add, reports dekh |
| `TEAM_MEMBER` | Assigned tasks dekhe, status update kare, time log bhare |
| `CLIENT` | Sirf project progress + milestones dekhe — time logs aur task details nahi |

---

## Data Model

### Company
```
id              UUID (PK)
name            VARCHAR
plan            ENUM: FREE, STARTER, GROWTH, ENTERPRISE
timezone        VARCHAR (default: Asia/Kolkata)
logo_url        VARCHAR
created_at      TIMESTAMP
```

### Project
```
id                  UUID (PK)
company_id          UUID (FK → Company)  ← multi-tenancy key
name                VARCHAR
description         TEXT
type                ENUM: CLIENT, DEPARTMENT
client_name         VARCHAR (nullable, agar type=CLIENT)
status              ENUM: ACTIVE, ON_HOLD, COMPLETED
owner_id            UUID (employee)
start_date          DATE
end_date            DATE
completion_percent  INT (0-100)  ← manually set by PROJECT_MANAGER
created_at          TIMESTAMP
```

### TaskList
```
id          UUID (PK)
project_id  UUID (FK → Project)
name        VARCHAR (e.g. "Website Dev", "Social Media")
position    INT (display order)
created_at  TIMESTAMP
```

### Task
```
id                  UUID (PK)
task_list_id        UUID (FK → TaskList)
project_id          UUID (FK → Project)
company_id          UUID  ← direct for fast queries
title               VARCHAR
description         TEXT
status              ENUM: OPEN, IN_PROGRESS, COMPLETED, ON_HOLD
priority            ENUM: HIGH, MEDIUM, LOW, NONE
tags                VARCHAR[] (array)
start_date          DATE
due_date            DATE
estimated_hours     DECIMAL
completion_percent  INT (0-100)
billing_type        ENUM: BILLABLE, NON_BILLABLE
parent_task_id      UUID (nullable, subtasks ke liye)
created_by          UUID
created_at          TIMESTAMP
```

### TaskAssignee  (Task ↔ Employee many-to-many join table)
```
task_id     UUID (FK → Task, PK part)
user_id     UUID (employee-service ka ID, PK part)
            ← composite PK: (task_id, user_id)
```

### TimeLog  ← EOD Report
```
id              UUID (PK)
task_id         UUID (FK → Task)
project_id      UUID (FK → Project)
company_id      UUID
user_id         UUID (employee)
date            DATE  ← roz ka log
hours_logged    DECIMAL (e.g. 2.5 = 2 hrs 30 min)
billing_type    ENUM: BILLABLE, NON_BILLABLE
notes           TEXT  ← "Aaj kya kiya" = EOD report text
created_at      TIMESTAMP
```

> Key insight: TimeLog.notes = EOD report. Alag service nahi chahiye.

### ProjectMember
```
id          UUID (PK)
project_id  UUID (FK → Project)
user_id     UUID (employee)
role        ENUM: PROJECT_MANAGER, TEAM_MEMBER, CLIENT
joined_at   TIMESTAMP
```

### Milestone
```
id                  UUID (PK)
project_id          UUID (FK → Project)
name                VARCHAR
status              ENUM: ACTIVE, COMPLETED
owner_id            UUID
start_date          DATE
end_date            DATE
completion_percent  INT (0-100)
created_at          TIMESTAMP
```

### Issue
```
id              UUID (PK)
project_id      UUID (FK → Project)
task_id         UUID (nullable, FK → Task)
title           VARCHAR
description     TEXT
reporter_id     UUID
assignee_id     UUID
severity        ENUM: NONE, CRITICAL
status          ENUM: OPEN, CLOSED
created_at      TIMESTAMP
closed_at       TIMESTAMP (nullable)
```

---

## API Endpoints

### Company
```
POST   /api/companies/register     → naya company signup
GET    /api/companies/me           → apni company info
```

### Projects
```
POST   /api/projects               → PROJECT_MANAGER
GET    /api/projects               → company ke sab projects
GET    /api/projects/{id}          → ek project detail
PUT    /api/projects/{id}          → PROJECT_MANAGER
DELETE /api/projects/{id}          → PROJECT_MANAGER
```

### Project Members
```
POST   /api/projects/{id}/members                      → member add
GET    /api/projects/{id}/members                      → team list
PUT    /api/projects/{id}/members/{userId}/role        → role change
DELETE /api/projects/{id}/members/{userId}             → member remove
```

### Task Lists
```
POST   /api/projects/{id}/task-lists    → category banao
GET    /api/projects/{id}/task-lists    → sab categories
PUT    /api/task-lists/{id}
DELETE /api/task-lists/{id}
```

### Tasks
```
POST   /api/task-lists/{id}/tasks       → task banao
GET    /api/projects/{id}/tasks         → project ke sab tasks
GET    /api/tasks/{id}                  → task detail
PUT    /api/tasks/{id}                  → status, priority update
DELETE /api/tasks/{id}
```

### Time Logs (EOD Reports)
```
POST   /api/tasks/{id}/time-logs        → TEAM_MEMBER: aaj ka log
GET    /api/tasks/{id}/time-logs        → ek task ke sab logs
GET    /api/time-logs/my?date=          → employee: apne logs
GET    /api/time-logs/team?date=        → MANAGER: poori team ka EOD
GET    /api/time-logs/project/{id}      → project wise summary
```

### Milestones
```
POST   /api/projects/{id}/milestones
GET    /api/projects/{id}/milestones
PUT    /api/milestones/{id}
DELETE /api/milestones/{id}
```

### Issues
```
POST   /api/projects/{id}/issues
GET    /api/projects/{id}/issues
PUT    /api/issues/{id}                 → status change
DELETE /api/issues/{id}
```

### Dashboard & Reports
```
GET    /api/dashboard                   → open tasks, overdue, summary
GET    /api/reports/workload            → Gantt-style team workload (FREE!)
```

---

## Kafka Events (Async Notifications)

| Event | Producer | Consumer |
|---|---|---|
| `TaskAssigned` | project-service | notification-service → employee ko alert |
| `TaskCompleted` | project-service | gamification-service → XP award (future) |
| `IssueCreated` | project-service | notification-service → manager ko alert |

---

## WorkTrack vs Zoho — Key Differentiators

| Feature | Zoho | WorkTrack |
|---|---|---|
| Workload Report | Paywalled | FREE |
| EOD Reports | Nahi hai | Built-in (TimeLog.notes) |
| AI Summary | Nahi | Claude API (Module B) |
| Google OAuth | Haan | Haan (via Keycloak) |
| Gamification | Nahi | Module I me |
| Pricing (25 users) | $75/month | $29/month |

---

## Spring Boot Service Structure

```
project-service/
  src/main/java/com/worktrack/project_service/
    ├── model/
    │   ├── Company.java
    │   ├── Project.java
    │   ├── TaskList.java
    │   ├── Task.java
    │   ├── TimeLog.java
    │   ├── ProjectMember.java
    │   ├── Milestone.java
    │   └── Issue.java
    ├── repository/         (JpaRepository for each)
    ├── service/            (business logic)
    ├── controller/         (REST endpoints)
    ├── dto/                (request/response objects)
    ├── client/             (Feign → employee-service)
    ├── producer/           (Kafka events)
    └── config/             (Security, Feign config)
```

---

## Containerization Strategy

| Environment | Tool | Reason |
|---|---|---|
| Local development | Dockerfile | Already banaya hua, easy to run |
| Production CI/CD | **Jib** (Maven plugin) | No Docker daemon needed, faster builds, sirf changed layers push |

```
# Production build command (GitHub Actions me)
mvn jib:build -Djib.to.image=registry/worktrack/project-service
```

---

## Implementation Order (Chunks)

1. **A1** — Entity classes + DB setup (Company, Project, TaskList, Task)
2. **A2** — Repositories + basic CRUD APIs for Projects + Tasks
3. **A3** — TimeLog API (EOD submit + manager view)
4. **A4** — ProjectMember + Role-based access
5. **A5** — Milestone + Issue APIs
6. **A6** — Dashboard + Workload Report API
7. **A7** — Kafka events (TaskAssigned → notification-service)

---

## Open Questions (Decided)

- Multi-tenancy: Shared DB, tenant-per-row ✅
- Project type: CLIENT + DEPARTMENT (flexible) ✅
- Roles: PROJECT_MANAGER / TEAM_MEMBER / CLIENT ✅
- EOD = TimeLog.notes (merged, no separate service) ✅
- Auth: Keycloak + Google OAuth ✅
- Port: 8085 ✅
