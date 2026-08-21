import { useProjectStore } from "@/lib/state/project-store";
import { saveChapterContent } from "@/lib/storage/use-project";
import { requestCompile } from "@/lib/compiler/typst-client";
import { queueCloudSyncForNode } from "@/lib/sync/cloud-sync";

export interface PipelineCallbacks {
  compile: () => void;
  save: (chapterId: string, content: string) => Promise<void> | void;
  cloudSync?: (chapterId: string) => void;
}

export interface PipelineOptions {
  compileMs?: number;
  saveMs?: number;
  schedule?: (fn: () => void, ms: number) => () => void;
}

const COMPILE_DEBOUNCE = 250;
const SAVE_DEBOUNCE = 2000;

const defaultSchedule: NonNullable<PipelineOptions["schedule"]> = (fn, ms) => {
  const t = setTimeout(fn, ms);
  return () => clearTimeout(t);
};

export function createPipeline(cb: PipelineCallbacks, opts: PipelineOptions = {}) {
  const compileMs = opts.compileMs ?? COMPILE_DEBOUNCE;
  const saveMs = opts.saveMs ?? SAVE_DEBOUNCE;
  const schedule = opts.schedule ?? defaultSchedule;

  let cancelCompile: (() => void) | null = null;
  const cancels = new Map<string, () => void>();

  function onEditorChange(chapterId: string, content: string) {
    useProjectStore.getState().setActiveContent(chapterId, content);

    cancelCompile?.();
    cancelCompile = schedule(() => cb.compile(), compileMs);

    cancels.get(chapterId)?.();
    cancels.set(
      chapterId,
      schedule(() => {
        cancels.delete(chapterId);
        void flushSave(chapterId);
      }, saveMs),
    );
  }

  async function flushSave(chapterId: string) {
    cancels.get(chapterId)?.();
    cancels.delete(chapterId);
    const { chapters, markSaved } = useProjectStore.getState();
    const chapter = chapters[chapterId];
    if (!chapter?.dirty) return;
    await cb.save(chapterId, chapter.content);
    markSaved(chapterId);
    cb.cloudSync?.(chapterId);
  }

  function flushAllSaves() {
    const ids = [...cancels.keys()];
    return Promise.all(ids.map((id) => flushSave(id)));
  }

  return { onEditorChange, flushSave, flushAllSaves };
}

const defaultPipeline = createPipeline({
  compile: () => requestCompile(),
  save: saveChapterContent,
  cloudSync: (chapterId) => void queueCloudSyncForNode(chapterId),
});

export const onEditorChange = defaultPipeline.onEditorChange;
export const flushSave = defaultPipeline.flushSave;
export const flushAllSaves = defaultPipeline.flushAllSaves;
