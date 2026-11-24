# AGENTS.md

Lipress is an out-of-the-box documentation tool built on Vite: point it at a documentation project and it serves that project as a site. This file records what an agent cannot infer cheaply from the code: exact commands, architectural invariants, and boundaries. Read the code for everything else.

## Commands

- `pnpm test` runs Jest; append a path to narrow it (e.g. `pnpm test tests/cli/commands/dev.test.ts`).
- `pnpm lint` runs `tsc`, ESLint, Stylelint, and a Prettier check with zero warnings allowed; `pnpm lint:fix` fixes what it can.
- `pnpm dist` builds the published package into `dist/` (TypeScript for `src/cli`, `src/shared`, and `src/index.ts`, plus copied client sources). There is no site build yet: `pnpm dev` is the only way to serve a documentation project.
- `pnpm dev` rebuilds `dist/` and restarts the dev server when `src/` changes. The CLI always runs from `dist/` and serves `dist/client`, so invoking `node bin/lipress.mjs` directly uses a stale build unless `pnpm dist` ran first.
- Install dependencies with pnpm, pinned in `packageManager`, and never add a second lockfile; running scripts through `npm run` is fine.

## Compatibility & Lifecycle

- Theme code must stay SSR-safe and StrictMode-safe: guard `window`, `document`, storage, and other browser-only APIs at module scope and during render, fall back to safe values outside the browser, keep effects idempotent across StrictMode's double invocation, and cancel timers, remove listeners, and unsubscribe on unmount.
- **Side effects**: `sideEffects` in `package.json` lists only CSS and SCSS. If a module must run for its side effects (for example a browser polyfill), add its package to `dependencies` and list the module in `sideEffects` so consumer bundlers keep it.
- The browser baseline is the Vite default `build.target` (`baseline-widely-available`); the CLI does not read any browserslist configuration.

## Code & Documentation

- Reuse existing primitives and utilities instead of reimplementing their logic.
- Prefer the hooks exported by `@lilib/hooks` (documentation: https://lilibraries.github.io/hooks/llms.txt) over hand-written equivalents for state, effects, callbacks, refs, and browser APIs, including SSR-safe layout effects; write a local hook only when no exported hook covers the case.
- Import `classnames` using the alias `cn` (e.g., `import cn from "classnames";`).
- For CSS class names, use nouns for elements and adjectives for states.
- Write theme styles in plain SCSS without CSS modules; prefix every authored class name with `lipress-` in kebab-case (e.g., `.lipress-nav-item`) and import stylesheets for their side effects in the components they style.
- Keep style files as close as possible to the components they style; split style files as needed.
- Reuse the existing tokens in `src/client/styles/_tokens.scss` and avoid adding new ones; a one-off value belongs inline in the rule that uses it rather than in a new token.
- If a new token is unavoidable, propose the most fitting name and value and wait for the user to confirm before adding it.
- Do not branch motion on `prefers-reduced-motion`: theme styles keep a single transition design, with no reduced-motion media queries or `transition: none` fallbacks.
- Consume motion through the `--lipress-motion-*` tokens instead of writing durations or timing functions inline. `duration-fast` covers color, opacity, and short micro-movements; `duration-base` covers surface changes such as hover, background, border, and shadow, and the selection state of grouped controls such as a segments indicator or a tab underline; `duration-slow` covers long-distance movement such as sidebars, drawers, and disclosure panels. Use `easing-standard` for anything that stays on screen, `easing-decelerate` for elements entering the screen, and `easing-accelerate` for elements leaving it with a duration one step shorter than the matching entrance.
- Published source must not depend on repository files outside the published source tree, such as tests, docs, or build scripts.
- Public APIs other than components and their props types must have accurate JSDoc describing their purpose, inputs, and outputs, with `@param` and `@returns` where applicable. Component comments describe only the component's purpose; add comments to prop fields only where necessary, and do not document component parameters, return values, or props object types.
- Except for API documentation, keep comments concise and accurate: comment only where necessary, never on self-evident logic. Write comments, JSDoc, test titles and descriptions, and directive explanations in English; write documentation in English by default, and use the target language when the documentation targets a specific one.

## Module Boundaries

- `src/cli` and `src/client` must not import each other. The CLI is compiled to Node ESM ahead of time, while the client is transformed by Vite, so a cross reference would couple the two build pipelines.
- Contracts shared by the CLI and the client live in `src/shared` (the documentation model, the site configuration, and the serialized head format). Keep that directory environment-agnostic: no Node or browser APIs, no imports from `src/cli` or `src/client`.
- Relative imports in the TypeScript compiled by `tsc` (`src/cli`, `src/shared`, `src/index.ts`) carry a `.js` extension because it is emitted as Node ESM; imports in `src/client` stay extensionless because Vite resolves the TypeScript sources directly.
- The vite root is the documentation project, not the packaged client: the CLI injects the client entry by absolute path (`/@fs`, realpath-resolved) and dedupes its bare imports to the project root, so react always comes from the project. Rooting vite at the client, or dropping the dedupe, silently gives the client its own react copy.
- The client is installed under `node_modules`, which vite's dependency scanner does not crawl, so every bare import the client makes must be listed in `optimizeDeps.include`; otherwise the browser receives CommonJS sources instead of pre-bundled ESM.

## Testing

- Tests are not colocated: `tests/cli` and `tests/client` mirror their source areas, and Jest collects `tests/**/*.test.(ts|tsx)` in `jsdom` by default.
- Components under `src/client` (including `Root`) get at most a simple rendering smoke test that verifies they render; do not add complex interaction, style, lifecycle, edge-case, or prop-combination tests. This limit does not apply to non-component logic such as entry initialization and utility functions.
- Write that smoke test only when the component meets at least one of these criteria: it reads `window`, `document`, storage, or another browser-only API while rendering or branches on the environment; it derives rendered content through defaults, fallbacks, or conditional branches instead of only selecting class names; code outside it depends on the structure it emits, such as `useScrollSpy`, the TOC, or routing; or it owns accessibility semantics that change with state, such as `aria-current`, `aria-pressed`, or an `aria-label` fallback.
- Pure presentational leaf components, such as icons, dividers, and style wrappers that only compose slots and class names, need no test at all. Never add a rendering test to raise coverage.
- Tests for lifecycle-dependent behavior must cover cleanup on unmount and StrictMode idempotency, except the component tests under `src/client`, which still only verify normal rendering.
- Test SSR-specific behavior in a Node environment, explicitly selected with `/** @jest-environment node */` unless the test configuration already selects it.
- Do not suppress unhandled promise rejections without a specific, justified reason.

## Change Validation

- After every round of changes, review the changed code for correctness, contract consistency, and completeness, fix confirmed defects, and review again until a round finds none. Treat as a finding any incorrect behavior, contract violation, or incomplete requirement; ask for confirmation on uncertain findings, and do not report completion while a confirmed defect is unresolved.
- Before reporting completion, inspect the files actually written or modified, including new and untracked files; a tracked Git diff alone is insufficient.
- Verify language compliance by reading the comments, JSDoc, test titles, and documentation added or modified. Passing lint, type checks, and tests does not establish it. Fix violations you introduced, or report the remaining violation instead of claiming compliance.

## Boundaries

- Never edit generated output (`dist/`) or `CHANGELOG.md` by hand.
- The published package (`@lilib/lipress`) must support both global and local installation: the `bin` entry and the `dist/client` sources must resolve from inside the package, and the documentation project root must come from the caller's working directory or the `root` option, never from an assumption about the install mode.
- Ask before adding or removing dependencies, or before changing the public API: exports of `src/index.ts`, CLI options, virtual module names, or the published paths in `package.json`.
- Keep every commit self-contained and passing.

## Commits & Releases

- Before running `git commit`, present the planned commit message and wait for the user to confirm it.
- `CHANGELOG.md` is generated automatically by release-it from commit history.
- Commit messages must follow Conventional Commits and be written in English. Wrap code identifiers in backticks.
- `.release-it.json` applies no path filter, so the commit type alone decides what enters the changelog. Use `feat`, `fix`, `perf`, `revert`, or a `!`-suffixed type only for commits that change `src/` (for example `feat!:`/`chore!:`; do not use a `BREAKING CHANGE` footer).
- Commits that only touch docs, tests, build scripts, or config must use a hidden type (`docs`, `test`, `build`, `ci`, `chore`, `refactor`, `style`).
