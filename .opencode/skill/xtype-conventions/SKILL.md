---
name: xtype-conventions
description: Use when working in the xtype repo — x framework (@thexjs) conventions, islands rules, worker prebuild pattern, data-flow rules, and GitHub issue→PR workflow
---

# xtype project conventions

## x framework quick facts (verified against packages/core source)

- Islands: page module exports `export const islands = { ComponentName }`; JSX uses `<Island name="ComponentName" client="load">`. Bundled per-route by Bun.build (React external), served at `/_islands/<entryId>/<entryId>.js`. For server-mode routes this happens lazily at runtime — verify during Vercel deploy work (issue #9); fallback is pre-bundling islands in a build script.
- Islands get NO props and ARE server-rendered first: all browser API access goes inside `useEffect`. Read `[projectId]` from `window.location.pathname`.
- Env-scanner stubs islands containing `process.env` / `Bun.env` references. After adding any heavy dep to an island, curl the island JS and grep for `process.env` before trusting it.
- Static mode prerenders once with empty params — never use for dynamic routes.
- Workers: `scripts/build-workers.ts` (Bun.build, target browser) → `public/workers/*.js`; instantiate with string URL. Run via predev/prebuild hooks.
- Tailwind needs `@tailwindcss/cli` devDep; input `src/styles/globals.css`, output auto-linked `public/styles.css`.

## Repo workflow

- Issues at github.com/abdelkabirouadoukou/xtype define scope + acceptance criteria; labels: area:*, risk:*, P0/P1/P2.
- Branch per issue: `feat/N-slug`. PR body: `Closes #N` + verification checklist. Merge to main before starting next issue.
- Commit style: conventional-ish, reference issue number.

## Non-negotiables

- Never import from `src/islands/*` into page components other than registering/rendering `<Island>`.
- Never bundle wasm/fonts — they live in `public/` and are fetched at runtime.
- Never let editor keystrokes trigger React re-renders of the editor component.
- Tokens/secrets never in localStorage (future GitHub sync uses IndexedDB + @thexjs/auth only for OAuth exchange).
