import { useEffect, useState } from "react";
import { searchAllChapters } from "@/lib/project-ops";
import { useProjectStore } from "@/lib/state/project-store";

export default function ProjectSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ chapterId: string; filename: string; snippet: string }[]>([]);
  const setActiveChapter = useProjectStore((s) => s.setActiveChapter);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    let alive = true;
    void searchAllChapters(query).then((r) => {
      if (alive) setResults(r);
    });
    return () => {
      alive = false;
    };
  }, [query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[14vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search all chapters…"
          autoFocus
          className="w-full border-b border-border bg-transparent px-5 py-4 text-base outline-none"
        />
        <ul className="max-h-80 overflow-y-auto">
          {results.map((r) => (
            <li key={r.chapterId}>
              <button
                onClick={() => {
                  setActiveChapter(r.chapterId);
                  setOpen(false);
                }}
                className="w-full px-5 py-3 text-left hover:bg-background"
              >
                <p className="text-sm font-medium">{r.filename}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">…{r.snippet}…</p>
              </button>
            </li>
          ))}
          {query && results.length === 0 && (
            <li className="px-5 py-6 text-center text-sm text-muted-foreground">No matches</li>
          )}
        </ul>
      </div>
    </div>
  );
}
