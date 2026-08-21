import { useProjectStore } from "@/lib/state/project-store";
import { saveChapterContent } from "@/lib/storage/use-project";
import { requestCompile } from "@/lib/compiler/typst-client";

const COMPILE_DEBOUNCE = 250;
const SAVE_DEBOUNCE = 2000;

let compileTimer: ReturnType<typeof setTimeout> | null = null;
const saveTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function onEditorChange(chapterId: string, content: string) {
  useProjectStore.getState().setActiveContent(chapterId, content);

  if (compileTimer) clearTimeout(compileTimer);
  compileTimer = setTimeout(() => requestCompile(), COMPILE_DEBOUNCE);

  const existing = saveTimers.get(chapterId);
  if (existing) clearTimeout(existing);
  saveTimers.set(
    chapterId,
    setTimeout(() => {
      saveTimers.delete(chapterId);
      void flushSave(chapterId);
    }, SAVE_DEBOUNCE),
  );
}

export async function flushSave(chapterId: string) {
  const timer = saveTimers.get(chapterId);
  if (timer) {
    clearTimeout(timer);
    saveTimers.delete(chapterId);
  }
  const { chapters, markSaved } = useProjectStore.getState();
  const chapter = chapters[chapterId];
  if (!chapter?.dirty) return;
  await saveChapterContent(chapterId, chapter.content);
  markSaved(chapterId);
}

export function flushAllSaves() {
  const ids = [...saveTimers.keys()];
  return Promise.all(ids.map((id) => flushSave(id)));
}
