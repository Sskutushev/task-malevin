# Construction Work Journal

Production-oriented implementation of the test task: "Журнал работ на строительном объекте".

## Stack and why

- Frontend: React + TypeScript + Vite + React Query + React Hook Form + Zod
  - fast DX, typed contracts, predictable server-state handling.
- Backend: Node.js + Express + TypeScript + Prisma + Zod
  - explicit layered architecture (controller/service/repository), safe validation and clear API boundaries.
- Data layer: PostgreSQL 16 + CockroachDB + Redis
  - PostgreSQL for master/reference data (`work_types`), CockroachDB for high-write logs (`work_logs`), Redis for API caching.
- Migrations: Flyway (separate pipelines per DB)
  - `flyway-pg` and `flyway-crdb` with `repair + migrate` on startup.
- Orchestration: Docker Compose (frontend + backend + postgres + cockroach + redis + flyway)
  - one-command local boot and deployment parity.

## Architecture

Monorepo with separated applications:

- `backend/` — REST API (`/api/v1`), Flyway SQL migrations, tests.
- `frontend/` — SPA for work logs management.
- `docker-compose.yml` — full environment orchestration.

Backend layering:

1. Router -> Controller (HTTP concerns)
2. Service (business rules)
3. Repository (database access)
4. Shared infra (errors, logger, response envelope, middleware)

## Features implemented

- Work logs list with pagination.
- Date filtering (`dateFrom`, `dateTo`) and sorting (`date`, `createdAt`, asc/desc).
- Create work log with required field validation.
- Delete work log.
- Edit work log (optional feature) via PATCH.
- Work type reference list from PostgreSQL (seeded by Flyway) for dropdown selection.
- Health checks for frontend and backend.

## Data split

- `PostgreSQL`: table `work_types` (reference/master data)
- `CockroachDB`: table `work_logs` (operational log stream, denormalized snapshot columns)
- `Redis`: cache for list endpoints (`work-logs`, `work-types`)

## Quick start (Docker, recommended)

1. Build and start:

```bash
docker-compose up --build
```

2. Open:

- Frontend: `http://localhost:8080`
- Backend health: `http://localhost:3000/health`
- Frontend health: `http://localhost:8080/health`
- Cockroach admin UI: `http://localhost:8081`

3. Stop:

```bash
docker-compose down
```

## Local run without Docker

### Backend

```bash
cd backend
cp .env.example .env
npm ci
npm run prisma:generate
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm ci
npm run dev
```

Frontend: `http://localhost:5173`, API target via `VITE_API_URL`.

## API overview

- `GET /api/v1/work-logs`
- `GET /api/v1/work-logs/:id`
- `POST /api/v1/work-logs`
- `PATCH /api/v1/work-logs/:id`
- `DELETE /api/v1/work-logs/:id`
- `GET /api/v1/work-types`
- `POST /api/v1/work-types`

## CI checks before publish

From repo root:

```bash
npm run format
npm run typecheck
npm run eslint
npm run test
npm run build
```

Or full pipeline in one command:

```bash
npm run ci:check
```
