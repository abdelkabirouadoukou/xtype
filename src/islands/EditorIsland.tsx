import { useEffect, useRef, useState } from "react";
import FileTree from "./FileTree";
import CodePane from "./CodePane";
import PreviewPane from "./PreviewPane";
import CommandPalette from "./command-palette";
import OutlinePanel from "./outline-panel";
import SymbolPalette from "./symbol-palette";
import { TEMPLATES, applyTemplate } from "./template-picker";
import ProjectSearch from "./project-search";
import CollabPane from "./collab-pane";
import EditorErrorBoundary from "./editor-error-boundary";
import OnboardingTour from "./onboarding-tour";
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

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !window.location.pathname.startsWith("/project/")) return;
    void navigator.serviceWorker.register("/sw.js").catch(() => {});
    void import("@/lib/snapshots").then(({ checkQuota }) =>
      checkQuota().then((q) => {
        if (q?.warning) console.warn(`[xtype] storage ${q.pct}% full`);
      }),
    );
  }, []);

  if (!projectId) {
    return isNew ? (
      <ProjectLoadingScreen />
    ) : (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <EditorErrorBoundary>
      <Editor projectId={projectId} />
      <OnboardingTour />
    </EditorErrorBoundary>
  );
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
  const [collabOn, setCollabOn] = useState(false);

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
        <ProjectSearch />
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
                <button
                  className="hover:text-foreground"
                  title="Push to GitHub"
                  onClick={() => {
                    const dest = prompt("GitHub repo (owner/name):", localStorage.getItem("xtype:gh-repo") ?? "");
                    if (!dest?.includes("/")) return;
                    localStorage.setItem("xtype:gh-repo", dest);
                    const [o, r] = dest.split("/");
                    void import("@/lib/github-sync").then(({ pushToRepo }) =>
                      pushToRepo(o, r, projectId).then((res) =>
                        alert(res.conflicts.length ? `Conflicts: ${res.conflicts.join(", ")}` : `Pushed ${res.pushed} files`),
                      ),
                    );
                  }}
                >
                  gh↑
                </button>
                <button
                  className="hover:text-foreground"
                  title="Pull from GitHub"
                  onClick={() => {
                    const dest = prompt("GitHub repo (owner/name):", localStorage.getItem("xtype:gh-repo") ?? "");
                    if (!dest?.includes("/")) return;
                    localStorage.setItem("xtype:gh-repo", dest);
                    const [o, r] = dest.split("/");
                    void import("@/lib/github-sync").then(({ pullFromRepo }) =>
                      pullFromRepo(o, r, projectId)
                        .then((n) => alert(`Pulled ${n} files`))
                        .catch((e) => alert(e.message)),
                    );
                  }}
                >
                  gh↓
                </button>
                <button
                  onClick={() => {
                    const next = !collabOn;
                    setCollabOn(next);
                    try { localStorage.setItem("xtype:collab", next ? "1" : "0"); } catch {}
                  }}
                  className={collabOn ? "font-medium text-accent" : "hover:text-foreground"}
                  title="Realtime collaboration"
                >
                  collab
                </button>
                <CompileStatusBar />
                <SaveBadge />
              </span>
            </header>
            <div className="flex min-h-0 flex-1">
              <div className="min-w-0 flex-1">
                {collabOn ? (
                  <CollabPane chapterId={activeId} projectId={projectId} initialContent={content} />
                ) : (
                  <CodePane key={`${activeId}-${vimOn}`} chapterId={activeId} initialContent={content} />
                )}
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
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-muted-foreground">
            <span>Start from a template:</span>
            <div className="grid grid-cols-2 gap-3">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => void applyTemplate(projectId, null, t.id)}
                  className="rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:border-accent"
                >
                  <p className="text-sm font-medium text-foreground">{t.label}</p>
                  <p className="text-xs">{t.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
      <SymbolPalette getView={() => (window as unknown as { __xtypeView?: unknown }).__xtypeView ?? null} />
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
