# Construction Work Journal

Production-oriented implementation of the test task: "Журнал работ на строительном объекте".

## Stack and rationale

- Frontend: `React + TypeScript + Vite + React Query + React Hook Form + Zod`
- Backend: `Node.js + Express + TypeScript + Prisma + Zod`
- Data layer: `PostgreSQL 16 + CockroachDB + Redis`
- Migrations: `Flyway` (independent migration streams for PostgreSQL and CockroachDB)
- Orchestration: `Docker Compose`

Why this stack:

- clear FE/BE separation and typed contracts
- scalable split for reference and high-write data
- fast local bootstrap and stable repeatable environment

## Architecture

Monorepo layout:

- `backend/` - REST API (`/api/v1`), modules, migrations, tests
- `frontend/` - SPA for journal operations and filters
- `.github/workflows/` - CI workflow + CD template workflow
- `docker-compose.yml` - full local environment orchestration

Backend layering:

1. Router -> Controller (HTTP)
2. Service (business logic)
3. Repository (data access)
4. Shared infra (errors, cache, middleware, logging)

Data split:

- PostgreSQL: `work_types` (reference dictionary, groups, quantity hints)
- CockroachDB: `work_logs` (high-write log stream with denormalized snapshots)
- Redis: caching for list endpoints (`work-types`, `work-logs`)

## Functional coverage

Core requirements:

- Work logs list with required columns: date, work type, volume/unit, executor
- Add entry with required field validation
- Delete entry
- Filter by date

Additional features implemented:

- Work type dictionary with 5 groups and prefilled work types
- Segmented selection flow: group -> work type
- Quantity hint per work type
- Edit support (PATCH endpoint)
- Extended UI productivity:
  - smart search by executor/work type/volume
  - sortable columns (date/work type/volume/executor)
  - row checkboxes + select-all + bulk delete
  - notes modal with structured header and segment badge
  - fixed-height records viewport with inner vertical scrolling

## Quick start (Docker recommended)

```bash
docker-compose up --build
```

Open:

- Frontend: `http://localhost:8080`
- Backend health: `http://localhost:3000/health`
- Frontend health: `http://localhost:8080/health`
- Cockroach admin UI: `http://localhost:8081`

Stop:

```bash
docker-compose down
```

## Local run (without Docker)

Backend:

```bash
cd backend
cp .env.example .env
npm ci
npm run prisma:generate
npm run dev
```

Frontend:

```bash
cd frontend
cp .env.example .env
npm ci
npm run dev
```

Frontend local URL: `http://localhost:5173`

## API overview

- `GET /api/v1/work-logs`
- `GET /api/v1/work-logs/:id`
- `POST /api/v1/work-logs`
- `PATCH /api/v1/work-logs/:id`
- `DELETE /api/v1/work-logs/:id`
- `GET /api/v1/work-types`
- `POST /api/v1/work-types`

## Quality gates

From repo root:

```bash
npm run ci:check
```

This runs:

- `format`
- `typecheck`
- `eslint`
- `test`
- `build`

GitHub workflows:

- `.github/workflows/ci.yml` - automated CI checks on push/PR
- `.github/workflows/cd-template.yml` - image build template (no publish)
