import { create } from "zustand";
import type { Chapter, CompileStatus } from "@/types/project";

interface ProjectState {
  projectId: string | null;
  chapters: Record<string, Chapter>;
  activeChapterId: string | null;
  compiledPdf: Blob | null;
  compileStatus: CompileStatus;
  compileError: string | null;

  setProject: (projectId: string) => void;
  loadChapters: (chapters: Chapter[]) => void;
  setActiveChapter: (id: string) => void;
  setActiveContent: (id: string, content: string) => void;
  markSaved: (id: string) => void;
  upsertChapter: (chapter: Chapter) => void;
  removeChapter: (id: string) => void;
  setCompileState: (
    status: CompileStatus,
    pdf?: Blob | null,
    error?: string | null,
  ) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projectId: null,
  chapters: {},
  activeChapterId: null,
  compiledPdf: null,
  compileStatus: "idle",
  compileError: null,

  setProject: (projectId) => set({ projectId }),

  loadChapters: (chapters) =>
    set((s) => {
      const map = Object.fromEntries(chapters.map((c) => [c.id, c]));
      const active =
        s.activeChapterId && map[s.activeChapterId]
          ? s.activeChapterId
          : (chapters[0]?.id ?? null);
      return { chapters: map, activeChapterId: active };
    }),

  setActiveChapter: (id) =>
    set((s) => (s.chapters[id] ? { activeChapterId: id } : {})),

  setActiveContent: (id, content) =>
    set((s) => {
      const chapter = s.chapters[id];
      if (!chapter || chapter.content === content) return {};
      return {
        chapters: {
          ...s.chapters,
          [id]: { ...chapter, content, dirty: true },
        },
      };
    }),

  markSaved: (id) =>
    set((s) => {
      const chapter = s.chapters[id];
      if (!chapter) return {};
      return { chapters: { ...s.chapters, [id]: { ...chapter, dirty: false } } };
    }),

  upsertChapter: (chapter) =>
    set((s) => ({ chapters: { ...s.chapters, [chapter.id]: chapter } })),

  removeChapter: (id) =>
    set((s) => {
      const chapters = { ...s.chapters };
      delete chapters[id];
      const activeChapterId =
        s.activeChapterId === id
          ? (Object.keys(chapters)[0] ?? null)
          : s.activeChapterId;
      return { chapters, activeChapterId };
    }),

  setCompileState: (status, pdf = null, error = null) =>
    set({ compileStatus: status, compiledPdf: pdf, compileError: error }),
}));
