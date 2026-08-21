# AGENTS.md

Guidance for AI coding agents working in this repo.

## What this is

xtype — client-side math document editor (0% server compute) built on the x framework (`@thexjs/core`). CodeMirror editing, KaTeX fast preview, Typst WASM → PDF in a web worker, IndexedDB persistence.

## Commands

```sh
bun install
bun run dev      # dev server (port auto-increments if busy)
bun run build    # outputs to .x/ (client + server)
bun run start    # serve production build
```

Typecheck: `bunx tsc --noEmit`. Tests: `bun test` (from PR #3 onward).

## Project map

- `src/pages/` — file-based routes. Editor route: `project/[projectId].tsx` (server mode, NO loader — server only streams an island mount).
- `src/islands/` — client-only components. Registered via `export const islands = {}` on the page. No props; read route params from `window.location` in effects.
- `src/lib/state/` — zustand store. Keystrokes write here; preview subscribes.
- `src/lib/storage/` — Dexie (IndexedDB). Source of truth for documents.
- `src/lib/editor/`, `src/lib/compiler/`, `src/lib/preview/` — CodeMirror setup + debounce pipeline, worker client, fast render.
- `src/workers/` — worker sources, compiled by `scripts/build-workers.ts` into `public/workers/`.
- `public/wasm/`, `public/fonts/` — runtime assets for Typst (never bundled).

## Framework gotchas (verified)

1. Islands are SSR'd first → no top-level `window`/`document` access in island components.
2. x's island bundler regex-scans output for env leaks and silently stubs islands that reference `process.env`. After adding deps, curl the served island JS and grep it.
3. No web-worker support in Bun.build pipeline — workers are pre-built by our own script to `public/workers/*.js`.
4. Static mode prerenders with empty params once — dynamic routes must stay server mode.
5. Tailwind requires `@tailwindcss/cli` devDep; x CLI runs `bunx tailwindcss`.

## Workflow

Work is tracked as GitHub issues (#1–#9 define MVP). One branch per issue (`feat/N-slug`), one PR closing it, merged before the next starts. Follow `.opencode/skill/xtype-conventions/SKILL.md` for detailed conventions.

## Style

TypeScript strict, no comments unless non-obvious, Tailwind utility classes with the CSS variables defined in `globals.css`.
