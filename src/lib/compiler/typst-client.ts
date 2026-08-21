import { useProjectStore } from "@/lib/state/project-store";

const WORKER_URL = "/workers/compiler.js";

let worker: Worker | null = null;
let generation = 0;

function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(WORKER_URL, { type: "module" });
  worker.onmessage = (
    e: MessageEvent<{
      type: "result" | "error";
      gen: number;
      pdf?: ArrayBuffer;
      message?: string;
    }>,
  ) => {
    const { type, gen, pdf, message } = e.data;
    if (gen !== generation) return;
    if (type === "result" && pdf) {
      useProjectStore
        .getState()
        .setCompileState("idle", new Blob([pdf], { type: "application/pdf" }));
    } else {
      useProjectStore.getState().setCompileState("error", null, message ?? "compile failed");
    }
  };
  worker.onerror = () => {
    useProjectStore.getState().setCompileState("error", null, "worker crashed");
  };
  return worker;
}

export function requestCompile() {
  const { chapters, activeChapterId, setCompileState } =
    useProjectStore.getState();
  if (!activeChapterId) return;

  const source = chapters[activeChapterId]?.content ?? "";
  const files: Record<string, string> = {};
  for (const c of Object.values(chapters)) {
    if (c.id !== activeChapterId) files[c.filename] = c.content;
  }

  const undefinedRefs = scanUndefinedRefs(source, files);
  if (undefinedRefs.length > 0) {
    console.warn("[xtype] unresolved references:", undefinedRefs);
  }

  generation += 1;
  setCompileState("compiling");
  getWorker().postMessage({ type: "compile", source, files, gen: generation });
}

export function scanUndefinedRefs(
  source: string,
  files: Record<string, string>,
): string[] {
  const defined = new Set<string>();
  const all = [source, ...Object.values(files)].join("\n");
  for (const m of all.matchAll(/<([a-zA-Z][\w-]*)>/g)) defined.add(m[1]);
  for (const m of all.matchAll(/#label\(\s*"([^"]+)"\s*\)/g)) defined.add(m[1]);
  const missing = new Set<string>();
  for (const m of source.matchAll(/@([a-zA-Z][\w-]*)/g)) {
    if (!defined.has(m[1])) missing.add(m[1]);
  }
  for (const m of source.matchAll(/#ref\(\s*"([^"]+)"\s*\)/g)) {
    if (!defined.has(m[1])) missing.add(m[1]);
  }
  return [...missing];
}
