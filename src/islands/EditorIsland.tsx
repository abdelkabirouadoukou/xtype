import { useEffect, useRef, useState } from "react";
import FileTree from "./FileTree";
import CodePane from "./CodePane";
import PreviewPane from "./PreviewPane";
import CommandPalette from "./command-palette";
import OutlinePanel from "./outline-panel";
import CompileStatusBar from "./CompileStatusBar";
import ProjectLoadingScreen from "./ProjectLoadingScreen";
import { useOnlineStatus, useEventListener } from "@thexjs/hooks";
import { useProject } from "@/lib/storage/use-project";
import { useProjectStore } from "@/lib/state/project-store";
import { flushAllSaves } from "@/lib/editor/debounce-pipeline";

export default function EditorIsland() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    const parts = window.location.pathname.split("/").filter(Boolean);
    const param = parts[0] === "project" && parts[1]
      ? decodeURIComponent(parts[1])
      : null;
    if (!param) return;

    if (param === "new") {
      setIsNew(true);
      const freshId = crypto.randomUUID().slice(0, 8);
      window.history.replaceState(null, "", `/project/${freshId}`);
      setTimeout(() => {
        setProjectId(freshId);
        setIsNew(false);
      }, 900);
      return;
    }
    setProjectId(param);
  }, []);

  useEventListener("pagehide", () => void flushAllSaves());

  if (!projectId) {
    return isNew ? (
      <ProjectLoadingScreen />
    ) : (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  return <Editor projectId={projectId} />;
}

function Editor({ projectId }: { projectId: string }) {
  const { nodes } = useProject(projectId);
  const activeId = useProjectStore((s) => s.activeChapterId);
  const content = useProjectStore(
    (s) => (activeId ? s.chapters[activeId]?.content : undefined) ?? "",
  );
  const online = useOnlineStatus();
  const [vimOn, setVimOn] = useState(false);
  const [splitOn, setSplitOn] = useState(false);
  const [secondaryId, setSecondaryId] = useState<string | null>(null);

  useEffect(() => {
    import("@/lib/editor/editor-prefs").then(({ isVimEnabled, isSplitView }) => {
      setVimOn(isVimEnabled());
      setSplitOn(isSplitView());
    });
    const onVim = () => setVimOn(isVimEnabledSafe());
    const onSplit = () => setSplitOn(isSplitViewSafe());
    function isVimEnabledSafe() {
      try { return localStorage.getItem("xtype:vim-enabled") === "1"; } catch { return false; }
    }
    function isSplitViewSafe() {
      try { return localStorage.getItem("xtype:split-view") === "1"; } catch { return false; }
    }
    window.addEventListener("xtype:vim-changed", onVim);
    window.addEventListener("xtype:split-changed", onSplit);
    return () => {
      window.removeEventListener("xtype:vim-changed", onVim);
      window.removeEventListener("xtype:split-changed", onSplit);
    };
  }, []);

  const files = (nodes ?? []).filter((n) => n.type === "file");

  return (
    <div className="flex h-full">
      <FileTree projectId={projectId} nodes={nodes ?? []} />
      <main className="flex min-w-0 flex-1 flex-col">
        <CommandPalette />
        {activeId ? (
          <>
            <header className="flex items-center justify-between border-b border-border px-4 py-2 text-sm text-muted-foreground">
              <span>{projectId}</span>
              <span className="flex items-center gap-4">
                {!online && <span className="text-yellow-500">offline — edits stay local</span>}
                <button
                  onClick={() => import("@/lib/editor/editor-prefs").then(({ setVimEnabled }) => setVimEnabled(!vimOn))}
                  className={vimOn ? "font-medium text-accent" : "hover:text-foreground"}
                  title="Vim keybindings"
                >
                  vim
                </button>
                <button
                  onClick={() => import("@/lib/editor/editor-prefs").then(({ setSplitView }) => setSplitView(!splitOn))}
                  className={splitOn ? "font-medium text-accent" : "hover:text-foreground"}
                  title="Split view"
                >
                  split
                </button>
                <CompileStatusBar />
                <SaveBadge />
              </span>
            </header>
            <div className="flex min-h-0 flex-1">
              <div className="min-w-0 flex-1">
                <CodePane key={`${activeId}-${vimOn}`} chapterId={activeId} initialContent={content} />
              </div>
              {splitOn && (
                <div className="flex min-w-0 flex-1 flex-col border-l border-border">
                  <select
                    value={secondaryId ?? ""}
                    onChange={(e) => setSecondaryId(e.target.value || null)}
                    className="border-b border-border bg-transparent px-3 py-1.5 text-xs text-muted-foreground outline-none"
                  >
                    <option value="">second chapter…</option>
                    {files.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                  {secondaryId && (
                    <SplitPane chapterId={secondaryId} vimOn={vimOn} />
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            No chapters yet — create one on the left.
          </div>
        )}
      </main>
      <section className="flex w-1/3 border-l border-border">
        {activeId ? (
          <>
            <div className="min-w-0 flex-1" data-preview-pane>
              <PreviewPane chapterId={activeId} />
            </div>
            <OutlinePanel chapterId={activeId} />
          </>
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

function SplitPane({ chapterId, vimOn }: { chapterId: string; vimOn: boolean }) {
  const content = useProjectStore(
    (s) => s.chapters[chapterId]?.content ?? "",
  );
  return (
    <div className="min-h-0 flex-1">
      <CodePane key={`${chapterId}-${vimOn}`} chapterId={chapterId} initialContent={content} />
    </div>
  );
}
