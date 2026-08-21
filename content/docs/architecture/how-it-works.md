---
title: How it works
---

# How it works

```
keystroke → CodeMirror → zustand store ─┬→ KaTeX fast preview (250ms debounce)
                                        ├→ IndexedDB autosave (2s idle)
                                        └→ compiler worker → Typst WASM → PDF blob
```

- The page shell is static HTML; one client island owns everything.
- A generation counter drops stale compile results so typing never lags.
- The Typst engine runs in a nested worker (JSPI when available); wasm + fonts load once from static assets.
- Dexie (IndexedDB) is the source of truth — the store is just a cache.
