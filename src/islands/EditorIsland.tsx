import { useEffect, useRef, useState } from "react";
import { EditorView } from "codemirror";

export default function EditorIsland() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const cmRef = useRef<HTMLDivElement>(null);
  const [cmReady, setCmReady] = useState(false);

  useEffect(() => {
    const parts = window.location.pathname.split("/").filter(Boolean);
    if (parts[0] === "project" && parts[1]) {
      setProjectId(decodeURIComponent(parts[1]));
    }
  }, []);

  useEffect(() => {
    if (!cmRef.current) return;
    const view = new EditorView({
      parent: cmRef.current,
      doc: "Hello $x^2$ — CodeMirror is alive inside the island.",
    });
    setCmReady(true);
    return () => view.destroy();
  }, []);

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border px-4 py-2 text-sm text-muted-foreground">
        project: <span className="text-foreground">{projectId ?? "?"}</span>
        <span className="ml-4">
          CodeMirror smoke test:{" "}
          {cmReady ? (
            <span className="text-green-500">bundled + mounted OK</span>
          ) : (
            "mounting…"
          )}
        </span>
      </header>
      <div ref={cmRef} className="min-h-24 border-b border-border bg-card p-2" />
      <div className="flex flex-1 items-center justify-center gap-4">
        <button
          onClick={() => setCount((c) => c + 1)}
          className="rounded-lg bg-accent px-4 py-2 font-medium text-white"
        >
          island interactivity check: clicked {count}x
        </button>
      </div>
    </div>
  );
}
