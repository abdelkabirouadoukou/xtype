import { useEffect, useMemo, useRef, useState } from "react";
import { useProjectStore } from "@/lib/state/project-store";

interface Action {
  id: string;
  label: string;
  hint?: string;
  run: () => void;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const chapters = useProjectStore((s) => s.chapters);
  const activeChapterId = useProjectStore((s) => s.activeChapterId);
  const setActiveChapter = useProjectStore((s) => s.setActiveChapter);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
    else setQuery("");
  }, [open]);

  const actions = useMemo<Action[]>(() => {
    const list: Action[] = Object.values(chapters).map((c) => ({
      id: `chapter-${c.id}`,
      label: `Switch to ${c.filename}`,
      hint: "chapter",
      run: () => setActiveChapter(c.id),
    }));
    list.push(
      {
        id: "toggle-preview",
        label: "Toggle preview focus",
        hint: "view",
        run: () =>
          document
            .querySelector("[data-preview-pane]")
            ?.scrollIntoView({ behavior: "smooth" }),
      },
      {
        id: "export-pdf",
        label: "Export PDF (compile & print)",
        hint: "export",
        run: () => window.dispatchEvent(new CustomEvent("xtype:export-pdf")),
      },
      {
        id: "settings",
        label: "Open settings",
        hint: "nav",
        run: () => (window.location.href = "/settings"),
      },
      {
        id: "docs",
        label: "Open documentation",
        hint: "nav",
        run: () => (window.location.href = "/docs"),
      },
    );
    return list;
  }, [chapters, setActiveChapter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter((a) => a.label.toLowerCase().includes(q));
  }, [actions, query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[14vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
            if (e.key === "Enter") { filtered[active]?.run(); setOpen(false); }
          }}
          placeholder="Run a command…"
          className="w-full border-b border-border bg-transparent px-5 py-4 text-base outline-none"
          autoFocus
        />
        <ul className="max-h-80 overflow-y-auto">
          {filtered.map((a, i) => (
            <li key={a.id}>
              <button
                onClick={() => { a.run(); setOpen(false); }}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center justify-between px-5 py-3 text-left text-sm ${
                  i === active ? "bg-background" : ""
                } ${a.id === `chapter-${activeChapterId}` ? "opacity-50" : ""}`}
              >
                <span>{a.label}</span>
                <span className="text-xs text-muted-foreground">{a.hint}</span>
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-5 py-6 text-center text-sm text-muted-foreground">No commands</li>
          )}
        </ul>
      </div>
    </div>
  );
}
