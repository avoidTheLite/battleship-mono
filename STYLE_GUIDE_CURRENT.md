# Style Guide — Current Codebase

> Descriptive, not prescriptive. Documents only what was observed across
> `battleship-mono` (primary) and the reference repos `risk-socket` and
> `risk-vite`. A junior developer should be able to read this and immediately
> understand the existing codebase.

---

## Module System

**battleship-mono / apps/api and packages/util**
- Fully ESM. Both `apps/api/package.json` and `packages/util/package.json`
  declare `"type": "module"`.
- All relative imports include the `.ts` file extension explicitly:
  ```ts
  import config from './config.ts';
  import gameRouter from './game/gameRouter.ts';
  ```
  This is required by Node's `NodeNext` module resolver and is consistent
  throughout the codebase.
- The shared base tsconfig enforces `module: NodeNext` /
  `moduleResolution: nodenext`.

**risk-socket (reference)**
- CommonJS. No `"type": "module"`. tsconfig sets `"module": "commonjs"`.
- Imports have no file extensions: `import db from "./db/db"`.

**risk-vite (reference)**
- ESM. `"type": "module"`. Bundler-mode resolution (Vite / `moduleResolution:
  bundler`) — no extensions needed in imports.

---

## Language and TypeScript Conventions

- All source files are `.ts` or `.tsx`. No `.js` files in any project.
- TypeScript version: 5.8.x in battleship-mono; 5.7.x in the reference repos.
- **Shared tsconfig** (`packages/tsconfig/base.json`) is the single source of
  truth for compiler options in the monorepo. Individual packages extend it and
  add only their own `outDir`/`rootDir`.
- **Notable base settings:**
  - `target: ES2022`
  - `module: NodeNext` / `moduleResolution: nodenext`
  - `composite: true`, `declaration: true`, `declarationMap: true`,
    `sourceMap: true` — configured for project references
  - `isolatedModules: true` — each file must be independently transpilable
  - `noEmit: true` — tsc is used for type-checking only; builds are handled
    by the bundler or left to a separate emit step
  - `allowImportingTsExtensions: true` — enables the `.ts`-suffixed import
    style in `apps/api`
  - `jsx: react-jsx` — set in the base even though the current monorepo has
    no React app yet
- **Strictness:** `strict` is **not enabled** in the base tsconfig.
  `risk-socket` (reference) explicitly sets `strict: false`. `risk-vite`
  (reference) uses `strict: true` with additional lint rules
  (`noUnusedLocals`, `noUnusedParameters`, etc.).
- Types are declared inline, close to their point of use. No separate
  `types/` directories observed.
- `import type` is used for type-only imports where noted
  (e.g., `import type { Express } from 'express'`).

---

## React Component Conventions

*(Observed in risk-vite; battleship-mono has no client app yet.)*

- **Functional components only** — no class components observed.
- **Arrow function syntax:**
  ```tsx
  const NewGameButton = ({ newGame }: NewGameButton) => {
    return <button onClick={newGame}>New Game</button>
  }
  ```
- **Props typed with an interface named identically to the component:**
  ```tsx
  interface NewGameButton {
    newGame: () => void
  }
  ```
- **Default exports** for every component.
- `App.tsx` is intentionally thin — it renders one top-level feature
  component (`<GameState>`), delegating all logic to feature folders.
- Fragments (`<>...</>`) are used at the top level in `App.tsx`.
- No `React.FC<Props>` type annotation — the component variable is typed by
  its arrow function signature.

---

## Styling Approach

*(Observed in risk-vite.)*

- **Mixed strategy:** Tailwind CSS 4 and styled-components 6 are both
  installed. Which one is used per component is unclear from config files
  alone.
- Tailwind is integrated via the Vite plugin (`@tailwindcss/vite`) — no
  `tailwind.config.js` file; configuration is handled in-plugin.
- The utility stack (`clsx`, `tailwind-merge`, `class-variance-authority`)
  is present, indicating a shadcn/ui-style pattern for variant-driven
  class composition.
- Radix UI primitives are used for accessible base components
  (`@radix-ui/react-slot`, `@radix-ui/react-dropdown-menu`).
- No CSS module files (`.module.css`) observed; `App.css` and `index.css`
  are global stylesheets.
- No class naming convention (BEM, etc.) enforced — Tailwind utility classes
  are the expected primary approach.

---

## State Management

*(Observed in risk-vite.)*

- Local React state (`useState`) is implied by component naming conventions
  (`gameState`).
- No external store (Redux, Zustand, Jotai) observed in `package.json`.
- State organisation is unclear from config files alone — inferred to live
  in feature-level components (e.g., `game/gameState`).

---

## Testing

**battleship-mono**
- Test runner: Jest 29.7.0 + ts-jest 29.
- Config file: `apps/api/src/jest.config.ts` (a TypeScript file loaded via
  `--config src/jest.config.ts`).
- ESM mode attempted: `extensionsToTreatAsEsm: ['.ts']`, `useESM: true` in
  ts-jest transform config.
- Global setup/teardown: `jest.setup.ts` runs Knex DB migrations and seeds
  before all tests; destroys the connection after.
- **Known breakage:** `@jest/globals` is pinned to `30.0.0-beta.3` while
  Jest itself is `29.7.0` — a version mismatch that causes runtime errors.
  The ESM+NodeNext+ts-jest combination has known incompatibilities.
- No test files exist yet (infra only).
- Root `package.json` test script is `"test": "test"` — a no-op placeholder.

**risk-socket (reference)**
- Same Jest 29 + ts-jest config pattern. Imports from `@jest/globals`
  explicitly.
- Extensive co-located test files: `*.test.ts` for unit tests,
  `*.integration.test.ts` for integration tests.
- Tests run with `--runInBand` (sequential) due to shared DB state.

**risk-vite (reference)**
- No testing infrastructure present.

---

## File and Folder Structure

**battleship-mono**
```
battleship-mono/
├── apps/
│   └── api/               # @battleship/api — Node server
│       └── src/
│           ├── app.ts         # Express app setup
│           ├── index.ts       # Server entrypoint
│           ├── config.ts      # App config
│           ├── knexfile.ts    # Knex config
│           ├── jest.config.ts # Test runner config
│           ├── jest.setup.ts  # Test lifecycle hooks
│           ├── game/          # Game domain
│           │   ├── gameRouter.ts
│           │   ├── gameController.ts
│           │   ├── gameState.ts
│           │   └── services/
│           ├── common/
│           └── db/
├── packages/
│   ├── util/              # @battleship/util — shared logger + middleware
│   ├── tsconfig/          # @battleship/tsconfig — shared TS config
│   └── eslint-config/     # shared ESLint config
├── reference/             # Non-package reference files (not a workspace member)
├── turbo.json
└── pnpm-workspace.yaml
```

- Feature-based organisation within `src/`: one folder per domain (`game/`),
  with `services/` subfolder for business logic.
- No barrel (`index.ts`) export files observed.
- Config files (`jest.config.ts`, `knexfile.ts`) live inside `src/` alongside
  source code.

**risk-vite (reference)**
```
src/
├── components/        # UI components by type
│   ├── Buttons/       # One file per button
│   ├── Card/
│   ├── Dialog/
│   └── ui/            # shadcn/ui primitives
├── game/              # Game feature
├── hooks/
├── common/
├── lib/
└── assets/
```

---

## Node / Server Conventions

- **Framework:** Express 5.x (battleship-mono); Express 4.x (risk-socket).
- **App assembly pattern:** `app.ts` creates and exports the Express app;
  `index.ts` (or `server.ts`) imports it and calls `.listen()`. This
  separation makes the app importable in tests without starting a port.
- **Router pattern:** One `*Router.ts` file per domain, created with
  `Router()` and exported. Mounted in `app.ts` under a path prefix:
  ```ts
  app.use('/game', gameRouter);
  ```
- **Controller pattern (battleship-mono):** Controllers are factory functions
  returning an object of handler methods:
  ```ts
  const gameControllerInstance = gameController();
  gameRouter.post('/new', gameControllerInstance.newGame);
  ```
- **Middleware:** `bodyParser.json()` is applied per-router, not globally.
  `cors()` is applied globally in `app.ts`. Custom `logMiddleware` and
  `logError` from `@battleship/util` are applied globally.
- **Logging:** A `Logger` class from `@battleship/util` is configured at the
  module level with a `logLevel` and `doc` (filename) label:
  ```ts
  const logger = Logger.configure({ logLevel: config.get('logLevel'), doc: 'app.ts' });
  ```
- **Error handling:** `logError()` middleware is registered last in `app.ts`
  (standard Express error-handler position).
- **Database:** Knex with PostgreSQL in production; SQLite3 in test
  environment. Migrations and seeds managed via Knex CLI.

---

## Notable Habits

- The `jest.config.ts` and `jest.setup.ts` are identical between
  battleship-mono and risk-socket — copy-pasted, not shared via a package.
- The base tsconfig includes `jsx: react-jsx` even though there is currently
  no React code in the monorepo — forward-looking configuration.
- `@jest/globals` beta (`30.0.0-beta.3`) is installed alongside stable Jest
  29 — an accidental mismatch, not an intentional dual-version strategy.
- The `turbo.json` `test` task has no `dependsOn` or `outputs` — tests run
  independently without a build prerequisite.
- Import paths in `apps/api` always use the `.ts` extension. This is required
  for `NodeNext` resolution but is a common source of confusion for
  developers coming from bundler-mode projects.
