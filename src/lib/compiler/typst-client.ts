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

  generation += 1;
  setCompileState("compiling");
  getWorker().postMessage({ type: "compile", source, files, gen: generation });
}
