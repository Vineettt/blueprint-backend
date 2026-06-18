# Blueprint API

A monorepo-based backend API built with TypeScript, Hono, and Drizzle ORM.

## Project Structure

```
blueprint-api/
├── apps/
│   ├── api/              # Main API application
│   └── worker/           # Background job worker
├── packages/
│   ├── config/           # Shared configuration
│   ├── db/               # Database clients and schema (Drizzle ORM)
│   ├── logger/           # Pino-based structured logger
│   └── pg-boss/          # PostgreSQL job queue
└── docs/                 # Documentation
```

## Architecture

The API follows a layered architecture:

```
Routes → Services → Repositories → Database
```

- **Routes** (`src/routes/`) — Hono OpenAPI route definitions and handlers. No business logic.
- **Services** (`src/services/`) — Business logic. Injected via TSyringe DI.
- **Repositories** (`src/repositories/`) — Database access via Drizzle ORM and raw SQL.
- **Middleware** (`src/middleware/`) — Auth, rate limiting, validation, DI injection, error handling.
- **Interfaces** (`src/interfaces/`) — TypeScript interfaces for services, repositories, and domain types.

See [docs/TSYRINGE_DI_GUIDE.md](./docs/TSYRINGE_DI_GUIDE.md) for the DI container setup and service registration.

## Quick Start

```bash
pnpm install
```

Copy the environment file and configure your databases and secrets:

```bash
cp .env.sample .env
```

Run the API:

```bash
pnpm dev:api
```

Run both API and worker:

```bash
pnpm dev
```

## Available Scripts

### Root
- `pnpm dev` — Run API and worker in parallel
- `pnpm dev:api` — Run API only
- `pnpm dev:worker` — Run worker only
- `pnpm build` — Build all packages and apps
- `pnpm lint` — ESLint across all packages
- `pnpm format` — Prettier across all packages
- `pnpm test` — Run tests across all packages

### API
- `pnpm --filter @blueprint/api dev` — Development server with hot reload
- `pnpm --filter @blueprint/api build` — Compile TypeScript
- `pnpm --filter @blueprint/api test:run` — Run tests once
- `pnpm --filter @blueprint/api test:coverage` — Run tests with coverage
- `pnpm --filter @blueprint/api lint` — ESLint
- `pnpm --filter @blueprint/api sync:routes` — Sync routes from code to database
- `pnpm --filter @blueprint/api seed:roles` — Seed roles
- `pnpm --filter @blueprint/api cleanup:tokens` — Clean up expired tokens

### Database
- `pnpm --filter @blueprint/api push:auth` — Push auth schema to database
- `pnpm --filter @blueprint/api push:pbac` — Push PBAC schema to database
- `pnpm --filter @blueprint/api migrate:auth` — Generate auth migrations
- `pnpm --filter @blueprint/api migrate:pbac` — Generate PBAC migrations

## API Endpoints

- **Base URL**: `http://localhost:3000`
- **Health**: `GET /api/health`
- **Swagger UI**: `http://localhost:3000/ui`
- **OpenAPI spec**: `GET /doc`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Yes (prod) | JWT signing secret — throws on startup if missing in production |
| `DB_AUTH_URL` | Yes | PostgreSQL connection string for auth database |
| `DB_PBAC_URL` | Yes | PostgreSQL connection string for PBAC database |
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | No | `development` or `production` |
| `CORS_ORIGIN` | No | Comma-separated allowed origins |
| `MAINTENANCE_MODE` | No | Set to `true` to enable maintenance mode |
| `RATE_LIMIT_STORE` | No | `memory` or `redis` (default: `memory`) |
| `REDIS_HOST` | No | Redis host for rate limiting (default: `localhost`) |
| `EMAIL_ENABLED` | No | Set to `false` to disable email sending |
| `LOG_LEVEL` | No | Pino log level (default: `info`) |

## Documentation

- [DI Guide](./docs/TSYRINGE_DI_GUIDE.md)
- [Docker Setup](./docs/DOCKER.md)
- [CI/CD Pipeline](./docs/CICD.md)
- [Pre-commit Hooks](./docs/PRECOMMIT.md)
