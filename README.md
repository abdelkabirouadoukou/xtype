# xtype

Client-side math document editor with **0% server compute**. Write Markdown mixed with LaTeX and AsciiMath, preview instantly via KaTeX, export publication-grade PDFs compiled by [Typst](https://typst.app) running in WASM inside a web worker. Documents persist locally in IndexedDB.

Built on the [x framework](https://github.com/anomalyco/opencode) (`@thexjs/core`) using its islands architecture — the editor page ships a thin HTML shell and hydrates one client island that owns everything.

## Development

Requires [Bun](https://bun.sh).

```sh
bun install
bun run dev     # http://localhost:3000
bun run build   # static + server output in .x/
```

## Architecture

| Concern | Where | Notes |
|---|---|---|
| Routes / shell | `src/pages` | Editor route has no loader; server only streams an empty island mount |
| Client island | `src/islands` | Reads route params from `window.location` (islands receive no props) |
| State | `src/lib/state` | Zustand; never re-renders the editor on keystrokes |
| Persistence | `src/lib/storage` | Dexie / IndexedDB is the source of truth |
| Compilation | `src/workers` + `scripts/build-workers.ts` | Workers pre-built to `public/workers/*.js` (x's Bun.build has no worker support) |

See the [issue tracker](https://github.com/abdelkabirouadoukou/xtype/issues) for the build-out plan.

## License

MIT
