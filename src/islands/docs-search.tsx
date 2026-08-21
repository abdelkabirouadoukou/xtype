import { useEffect, useMemo, useRef, useState } from "react";
import MiniSearch, { type SearchResult } from "minisearch";

interface Doc {
  id: string;
  title: string;
  section: string;
  text: string;
}

export default function DocsSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const mini = useRef<MiniSearch<Doc> | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open || mini.current) return;
    fetch("/search-index.json")
      .then((r) => r.json())
      .then((docs: Doc[]) => {
        mini.current = new MiniSearch({
          fields: ["title", "section", "text"],
          storeFields: ["title", "section"],
        });
        mini.current.addAll(docs);
      })
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  const doSearch = useMemo(
    () =>
      debounce((q: string) => {
        if (!q.trim() || !mini.current) {
          setResults([]);
          return;
        }
        setResults(mini.current.search(q, { fuzzy: 0.2, prefix: true }).slice(0, 8));
        setActive(0);
      }, 120),
    [],
  );

  useEffect(() => doSearch(query), [query, doSearch]);

  if (!open) return null;

  const go = (i: number) => {
    const r = results[i];
    if (!r) return;
    setOpen(false);
    window.location.href = `/docs/${r.id}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[12vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
            if (e.key === "Enter") go(active);
          }}
          placeholder="Search docs…"
          className="w-full border-b border-border bg-transparent px-5 py-4 text-base outline-none"
          autoFocus
        />
        <ul className="max-h-80 overflow-y-auto">
          {results.map((r, i) => (
            <li key={r.id}>
              <button
                onClick={() => go(i)}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center justify-between px-5 py-3 text-left text-sm ${
                  i === active ? "bg-background" : ""
                }`}
              >
                <span className="font-medium">{r.title}</span>
                <span className="text-xs text-muted-foreground">
                  {(r as unknown as Doc).section || "docs"}
                </span>
              </button>
            </li>
          ))}
          {query && results.length === 0 && (
            <li className="px-5 py-6 text-center text-sm text-muted-foreground">No results</li>
          )}
        </ul>
        <div className="border-t border-border px-5 py-2 text-xs text-muted-foreground">
          ↑↓ navigate · ↵ open · esc close
        </div>
      </div>
    </div>
  );
}

function debounce<T extends (...a: never[]) => void>(fn: T, ms: number): T {
  let t: ReturnType<typeof setTimeout> | null = null;
  return ((...args: never[]) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  }) as T;
}
