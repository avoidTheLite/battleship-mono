# Style Guide — Recommended 2026 Upgrade Path

> Each recommendation names the current pattern it replaces, explains why
> the new approach is preferred, and includes a before/after code example.
> Recommendations are grounded in what was actually observed in the codebase.

---

## Tooling

### 1. Replace the no-op root test script with Turborepo task delegation

**Replaces:** `"test": "test"` in root `package.json`.

**Why:** The current root script is a shell no-op. Turborepo's `turbo run test`
already orchestrates per-package test runs in dependency order. The root script
should delegate to it so `pnpm test` works from the repo root.

```json
// Before (package.json)
"scripts": {
  "test": "test"
}

// After
"scripts": {
  "test": "turbo run test"
}
```

---

### 2. Adopt ESLint flat config (eslint.config.js)

**Replaces:** Unclear from config files — the `packages/eslint-config` package
exists but its contents were not inspected.

**Why:** ESLint 9 (already used in `risk-vite`) ships flat config as the
default. The legacy `.eslintrc` format is deprecated. Flat config is explicit,
composable, and works with `typescript-eslint` v8.

```js
// Before (.eslintrc.json style, implicitly inherited)
{ "extends": ["@battleship/eslint-config"] }

// After (eslint.config.js)
import battleshipConfig from '@battleship/eslint-config';
export default [...battleshipConfig];
```

---

### 3. Add Prettier for formatting

**Replaces:** No formatter observed.

**Why:** Consistent formatting eliminates style debates in code review. Prettier
integrates with ESLint via `eslint-config-prettier` (disables conflicting rules)
and can be run as a pre-commit hook via `lint-staged`.

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100
}
```

---

## Testing

### 4. Replace Jest + ts-jest with Vitest for the client (when added)

**Replaces:** Jest 29 + ts-jest ESM mode — a combination that requires
significant configuration scaffolding and has known edge-case failures with
`NodeNext` module resolution.

**Why:** Vitest is Vite-native, ESM-first, and requires near-zero configuration
in a Vite project. It shares the same `vite.config.ts`, uses the same transform
pipeline, and is API-compatible with Jest (same `describe`/`it`/`expect` API).
For the server (`apps/api`), see recommendation 5 below.

```ts
// Before (jest.config.ts)
const jestConfig: JestConfigWithTsJest = {
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    "^.+\\.[tj]sx?$": ['ts-jest', { useESM: true }],
  },
  testEnvironment: 'node',
}
export default jestConfig;

// After (vitest.config.ts, for a future client package)
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

---

### 5. Fix the server test runner: align @jest/globals version or migrate to Vitest

**Replaces:** `@jest/globals@30.0.0-beta.3` + `jest@29.7.0` version mismatch.

**Why:** The beta/stable split causes runtime import errors before any test
logic runs. Two clean resolutions:

**Option A — Stay on Jest, fix the version pin (lower effort):**
```json
// Before
"@jest/globals": "30.0.0-beta.3",
"jest": "^29.7.0"

// After
"jest": "^29.7.0",
"@jest/globals": "^29.7.0"
```

**Option B — Migrate server to Vitest (recommended, consistent with client):**
```ts
// vitest.config.ts (apps/api)
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/vitest.setup.ts'],
  },
});
```
Vitest is ESM-native and eliminates the ts-jest transform layer entirely,
which is the root source of the existing breakage.

---

### 6. Use React Testing Library for component tests

**Replaces:** No client testing infrastructure exists yet.

**Why:** RTL encourages testing from the user's perspective (what is rendered,
what can be clicked) rather than implementation details. Pair with Vitest for
a zero-config setup.

```tsx
// smoke test pattern
import { render, screen } from '@testing-library/react';
import App from './App';

it('renders without crashing', () => {
  render(<App />);
  expect(screen.getByRole('main')).toBeInTheDocument();
});
```

---

### 7. Use MSW 2.x for API mocking in client tests

**Replaces:** No API mocking strategy exists yet.

**Why:** MSW (Mock Service Worker) intercepts fetch/XHR at the network layer,
meaning components are tested against realistic API shapes without a live
server. MSW 2.x uses the `http` handler API and works in both browser and
Node (via `msw/node`).

```ts
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/game/:id', () => {
    return HttpResponse.json({ id: '1', status: 'active' });
  }),
];
```

---

## React Patterns

### 8. Co-locate hooks with the components that own them

**Replaces:** Unclear co-location strategy — a top-level `hooks/` folder
was observed in `risk-vite`.

**Why:** A shared `hooks/` folder becomes a grab-bag over time. Hooks that
only serve one component or feature belong next to that component. Only hooks
used by multiple unrelated features warrant promotion to a shared location.

```
// Before
src/
  hooks/useGameState.ts
  game/GameBoard.tsx

// After
src/
  game/
    GameBoard.tsx
    useGameState.ts   ← co-located with its consumer
  hooks/              ← only truly shared hooks remain here
```

---

### 9. Name prop interfaces with a `Props` suffix

**Replaces:** Prop interfaces named identically to the component
(`interface NewGameButton { ... }`).

**Why:** When the interface and the component share a name, TypeScript
occasionally produces confusing error messages. The `Props` suffix is the
dominant community convention and clearly signals intent.

```tsx
// Before
interface NewGameButton {
  newGame: () => void
}
const NewGameButton = ({ newGame }: NewGameButton) => { ... }

// After
interface NewGameButtonProps {
  newGame: () => void
}
const NewGameButton = ({ newGame }: NewGameButtonProps) => { ... }
```

---

### 10. Consolidate the styling strategy — prefer Tailwind over styled-components

**Replaces:** Both Tailwind and styled-components installed simultaneously
in `risk-vite`.

**Why:** Two styling systems add bundle weight and cognitive overhead. Tailwind
4 with CVA covers the variant-component use case that styled-components is
typically used for, without the runtime JS cost or CSS-in-JS specificity
issues.

```tsx
// Before (styled-components)
const Button = styled.button<{ variant: 'primary' | 'ghost' }>`
  background: ${p => p.variant === 'primary' ? 'blue' : 'transparent'};
`;

// After (Tailwind + CVA)
import { cva } from 'class-variance-authority';

const button = cva('rounded px-4 py-2', {
  variants: {
    variant: {
      primary: 'bg-blue-600 text-white',
      ghost: 'bg-transparent border',
    },
  },
});

const Button = ({ variant, ...props }: ButtonProps) => (
  <button className={button({ variant })} {...props} />
);
```

---

## Node Patterns

### 11. Use `node:` protocol imports for built-in modules

**Replaces:** Bare built-in imports (e.g., `import path from 'path'`).

**Why:** The `node:` prefix explicitly identifies a Node built-in, prevents
shadowing by an npm package with the same name, and is the standard in modern
Node.js projects.

```ts
// Before
import path from 'path';

// After
import path from 'node:path';
```

---

### 12. Use structured logging consistently via the shared Logger

**Replaces:** Implicit or absent logging in individual packages.

**Why:** The `@battleship/util` Logger is already designed for structured,
level-based output with a `doc` label. Using it consistently (instead of
`console.log`) means log output is filterable and machine-readable in
production.

```ts
// Before
console.log('game created', gameId);

// After
logger.info({ gameId }, 'game created');
```

---

## Monorepo Tooling

### 13. Turborepo is the right call — configure task caching properly

**Replaces:** `turbo.json` `test` task with no `dependsOn` or cache config.

**Why:** The monorepo already uses Turborepo (good choice over raw pnpm
workspaces for task orchestration at this scale). The current `test` task
has no `dependsOn`, meaning tests can run before `build` completes for
packages that produce `dist/`. Adding the dependency ensures correctness.
Adding `outputs` enables cache hits on re-runs.

```json
// Before (turbo.json)
"test": {}

// After
"test": {
  "dependsOn": ["^build"],
  "inputs": ["src/**", "*.config.ts"],
  "outputs": ["coverage/**"]
}
```

**pnpm workspaces vs Turborepo tradeoff:**
pnpm workspaces alone handle dependency linking and script delegation.
Turborepo adds task-level caching, parallelism control, and the `dependsOn`
graph. Given that the repo already has Turborepo installed, the recommendation
is to lean into it rather than work around it.

---

## Type Safety

### 14. Enable `strict: true` in the shared base tsconfig

**Replaces:** No `strict` flag in `packages/tsconfig/base.json`; `strict:
false` in risk-socket.

**Why:** `strict: true` enables a family of checks (`strictNullChecks`,
`noImplicitAny`, etc.) that catch entire categories of runtime bugs at
compile time. The risk-vite reference already uses strict mode with
additional lint rules. The cost is a one-time fix of existing type errors;
the benefit is permanent.

```json
// Before (base.json)
{ "compilerOptions": { "target": "ES2022", "module": "NodeNext" } }

// After
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "strict": true
  }
}
```

---

### 15. Use Zod for runtime validation at API boundaries

**Replaces:** No runtime validation observed — request bodies are used
directly after `bodyParser.json()`.

**Why:** TypeScript types are erased at runtime. A `PATCH /game/:id/deploy`
request body is typed at compile time but has no shape guarantee at runtime.
Zod parses and validates in one step and infers the TypeScript type from the
schema, keeping the source of truth in one place.

```ts
// Before
gameRouter.patch('/:id/deploy', gameControllerInstance.deploy);
// req.body is `any` at runtime

// After
import { z } from 'zod';

const DeployBody = z.object({
  positions: z.array(z.object({ x: z.number(), y: z.number() })),
});

gameRouter.patch('/:id/deploy', (req, res, next) => {
  const result = DeployBody.safeParse(req.body);
  if (!result.success) return res.status(400).json(result.error);
  gameControllerInstance.deploy(req, res, next);
});
```

---

### 16. Share types between client and server via a workspace package

**Replaces:** No shared type package — types are currently defined per-repo.

**Why:** When a client and server share a schema (game state, API responses),
defining types once in a shared package eliminates drift. A `packages/types`
package (TypeScript only, no runtime code) can export interfaces and Zod
schemas that both `apps/api` and any future client package import.

```
packages/
  types/          # @battleship/types — new package
    src/
      game.ts     # GameState, Player, Ship interfaces
      api.ts      # Request/response shapes
```

---

## Migration Priority Matrix

| Recommendation | Impact | Effort | Priority |
|---|---|---|---|
| 5. Fix @jest/globals version mismatch | High | Low | **Do first** |
| 14. Enable `strict: true` | High | Medium | High |
| 4/5. Migrate to Vitest | High | Medium | High |
| 15. Zod for runtime validation | High | Medium | High |
| 16. Shared types package | High | Medium | High |
| 1. Fix root test script | Medium | Low | Medium |
| 13. Configure Turborepo task caching | Medium | Low | Medium |
| 11. `node:` protocol imports | Medium | Low | Medium |
| 9. Props suffix convention | Medium | Low | Medium |
| 6. RTL for component tests | Medium | Medium | Medium |
| 7. MSW 2.x for API mocking | Medium | Medium | Medium |
| 8. Co-locate hooks | Medium | Medium | Medium |
| 10. Consolidate to Tailwind | Medium | Medium | Medium |
| 12. Structured logging | Medium | Low | Medium |
| 2. ESLint flat config | Low | Medium | Low |
| 3. Add Prettier | Low | Low | Low |

### Rationale for High Impact rows

| Recommendation | Rationale |
|---|---|
| Fix @jest/globals version mismatch | Tests cannot run at all until this is resolved; it blocks everything else. |
| Enable `strict: true` | Catches null-reference and implicit-any bugs that will otherwise surface as production runtime errors. One-time cost, permanent benefit. |
| Migrate to Vitest | Eliminates the ESM/CJS/ts-jest transform conflict that is the root cause of the broken test runner. |
| Zod for runtime validation | Express 5 removed automatic body-parse error handling; unvalidated request bodies are the most common source of 500 errors in Node APIs. |
| Shared types package | Client/server type drift causes silent integration bugs. A single shared schema is the cheapest form of integration testing. |
