import { useEffect, useRef, useState } from "react";
import FileTree from "./FileTree";
import CodePane from "./CodePane";
import PreviewPane from "./PreviewPane";
import CompileStatusBar from "./CompileStatusBar";
import { useProject } from "@/lib/storage/use-project";
import { useProjectStore } from "@/lib/state/project-store";
import { flushAllSaves } from "@/lib/editor/debounce-pipeline";

export default function EditorIsland() {
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    const parts = window.location.pathname.split("/").filter(Boolean);
    if (parts[0] === "project" && parts[1]) {
      setProjectId(decodeURIComponent(parts[1]));
    }
    const onLeave = () => void flushAllSaves();
    window.addEventListener("pagehide", onLeave);
    return () => window.removeEventListener("pagehide", onLeave);
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
  const content = useProjectStore(
    (s) => (activeId ? s.chapters[activeId]?.content : undefined) ?? "",
  );

  return (
    <div className="flex h-full">
      <FileTree projectId={projectId} />
      <main className="flex min-w-0 flex-1 flex-col">
        {activeId ? (
          <>
            <header className="flex items-center justify-between border-b border-border px-4 py-2 text-sm text-muted-foreground">
              <span>{projectId}</span>
              <span className="flex items-center gap-4">
                <CompileStatusBar />
                <SaveBadge />
              </span>
            </header>
            <CodePane key={activeId} chapterId={activeId} initialContent={content} />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            No chapters yet — create one on the left.
          </div>
        )}
      </main>
      <section className="w-1/3 border-l border-border">
        {activeId ? (
          <PreviewPane chapterId={activeId} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            no chapter
          </div>
        )}
      </section>
    </div>
  );
}

function SaveBadge() {
  const dirtyCount = useProjectStore(
    (s) => Object.values(s.chapters).filter((c) => c.dirty).length,
  );
  return dirtyCount > 0 ? (
    <span>unsaved: {dirtyCount}</span>
  ) : (
    <span className="text-green-500">saved</span>
  );
}
