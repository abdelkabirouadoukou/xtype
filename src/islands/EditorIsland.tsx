import { useEffect, useRef, useState } from "react";
import { EditorView } from "codemirror";
import FileTree from "./FileTree";
import { useProject } from "@/lib/storage/use-project";
import { useProjectStore } from "@/lib/state/project-store";

export default function EditorIsland() {
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    const parts = window.location.pathname.split("/").filter(Boolean);
    if (parts[0] === "project" && parts[1]) {
      setProjectId(decodeURIComponent(parts[1]));
    }
  }, []);

  if (!projectId) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  return <Editor projectId={projectId} />;
}

function Editor({ projectId }: { projectId: string }) {
  useProject(projectId);
  const activeId = useProjectStore((s) => s.activeChapterId);
  const cmRef = useRef<HTMLDivElement>(null);
  const [cmReady, setCmReady] = useState(false);

  useEffect(() => {
    if (!cmRef.current) return;
    const view = new EditorView({
      parent: cmRef.current,
      doc: "Hello $x^2$ — editing loop lands in #5.",
    });
    setCmReady(true);
    return () => view.destroy();
  }, []);

  return (
    <div className="flex h-full">
      <FileTree projectId={projectId} />
      <main className="flex flex-1 flex-col">
        <header className="border-b border-border px-4 py-2 text-sm text-muted-foreground">
          project: <span className="text-foreground">{projectId}</span>
          {" · "}
          active: <span className="text-foreground">{activeId ?? "none"}</span>
          {" · "}
          {cmReady ? (
            <span className="text-green-500">editor ready</span>
          ) : (
            "mounting…"
          )}
        </header>
        <div ref={cmRef} className="flex-1 overflow-auto bg-card p-2" />
      </main>
      <section className="flex w-1/3 items-center justify-center border-l border-border text-sm text-muted-foreground">
        preview pane (#6)
      </section>
    </div>
  );
}
