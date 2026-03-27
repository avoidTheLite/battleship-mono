# battleship-mono

Classic Battleship game with a Node/Express API and React client in a Turborepo monorepo.

## Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [pnpm](https://pnpm.io/) v10+
- [Docker](https://www.docker.com/) (for the PostgreSQL database)

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

If native modules (`esbuild`, `sqlite3`) are blocked, approve their build scripts:

```bash
pnpm approve-builds
```

### 2. Start the database

The API uses PostgreSQL. A Docker Compose file and a `.env` file with default
values are provided in `apps/api/`:

```bash
cd apps/api
pnpm docker:db
```

This starts a PostgreSQL 17.3 container on port **5433** with default credentials
(see [Environment Variables](#environment-variables) below).

### 3. Run database migrations and seeds

```bash
cd apps/api
pnpm db:migrate
pnpm db:seed
```

### 4. Start the dev server

```bash
cd apps/api
pnpm dev
```

This runs the TypeScript type-checker in watch mode alongside `nodemon`, which
restarts the server on file changes. The API listens on **http://localhost:3002**
by default.

## Running Tests

### From the repo root (recommended)

```bash
pnpm test
```

This uses Turborepo to build workspace dependencies first (`@battleship/util`),
then runs Vitest in every package that has a `test` script.

### From the API package directly

```bash
cd apps/api
pnpm test
```

Tests use **Vitest** with the `node` environment. The test database is an
**in-memory SQLite3** instance, so no Docker or PostgreSQL is needed to run tests.

### Current test suite

| File | What it covers |
|---|---|
| `src/app.test.ts` | Health check — `GET /health` returns `200 { status: 'ok' }` |
| `src/game/services/AttackService.test.ts` | Attack service logic with mocked game state |

## Project Structure

```
battleship-mono/
├── apps/
│   └── api/                  # @battleship/api — Express server
│       ├── src/
│       │   ├── app.ts            # Express app setup and middleware
│       │   ├── index.ts          # Server entrypoint (listen)
│       │   ├── config.ts         # Environment config
│       │   ├── knexfile.ts       # Database config (PG + SQLite for tests)
│       │   ├── db/               # Migrations and seeds
│       │   ├── game/             # Game domain (router, controller, services)
│       │   └── common/           # Shared types and utilities
│       ├── vitest.config.ts      # Test runner config
│       └── docker-compose.yml    # PostgreSQL container
├── packages/
│   ├── util/                 # @battleship/util — Logger and middleware
│   ├── tsconfig/             # @battleship/tsconfig — Shared TS config
│   └── eslint-config/        # Shared ESLint config
├── turbo.json                # Turborepo task config
└── pnpm-workspace.yaml       # Workspace package locations
```

## Available Scripts

### Root

| Script | Description |
|---|---|
| `pnpm test` | Build dependencies, then run all tests via Turborepo |

### apps/api

| Script | Description |
|---|---|
| `pnpm dev` | Start the API in development mode with hot reload |
| `pnpm build` | Type-check and compile TypeScript |
| `pnpm test` | Run Vitest |
| `pnpm docker:db` | Start the PostgreSQL container |
| `pnpm db:migrate` | Run pending Knex migrations |
| `pnpm db:rollback:all` | Rollback all migrations |
| `pnpm db:seed` | Seed the database |

## Environment Variables

A `.env` file with default values is provided in `apps/api/`. Both the Node
server and Docker Compose read from it. Edit the values to match your setup.

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `local` | Environment (`local`, `development`, `test`, `production`) |
| `SERVER_PORT` | `3002` | Port the Express server listens on |
| `LOG_LEVEL` | `debug` | Logging verbosity |
| `DB_URL` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5433` | PostgreSQL port |
| `DB_USER` | `postgres` | PostgreSQL username |
| `DB_PASSWORD` | `password` | PostgreSQL password |
| `DB_NAME` | `battleship_db` | PostgreSQL database name |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check — returns `{ status: 'ok' }` |
| `POST` | `/game/new` | Create a new game |
| `GET` | `/game/:id` | Get game state by ID |
| `PATCH` | `/game/:id/deploy` | Deploy ships |
| `POST` | `/game/:id/attack` | Make an attack |
