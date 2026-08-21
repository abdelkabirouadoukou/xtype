import { describe, expect, it } from "bun:test";
import { useProjectStore } from "./project-store";

const chapter = (id: string, content = "x") => ({
  id,
  filename: `${id}.md`,
  content,
  dirty: false,
});

describe("project store", () => {
  it("marks dirty on edit and clean on save", () => {
    const s = useProjectStore.getState();
    s.upsertChapter(chapter("a"));
    s.setActiveContent("a", "edited");
    expect(useProjectStore.getState().chapters.a.dirty).toBe(true);
    useProjectStore.getState().markSaved("a");
    expect(useProjectStore.getState().chapters.a.dirty).toBe(false);
  });

  it("skips no-op edits", () => {
    useProjectStore.getState().upsertChapter(chapter("b", "same"));
    useProjectStore.getState().setActiveContent("b", "same");
    expect(useProjectStore.getState().chapters.b.dirty).toBe(false);
  });

  it("loadChapters picks first chapter when none active", () => {
    useProjectStore.setState({ activeChapterId: null });
    useProjectStore.getState().loadChapters([chapter("1"), chapter("2")]);
    expect(useProjectStore.getState().activeChapterId).toBe("1");
  });

  it("removeChapter reassigns active", () => {
    useProjectStore.getState().loadChapters([chapter("1"), chapter("2")]);
    useProjectStore.getState().setActiveChapter("2");
    useProjectStore.getState().removeChapter("2");
    expect(useProjectStore.getState().activeChapterId).toBe("1");
  });

  it("compile state transitions", () => {
    const blob = new Blob(["pdf"]);
    useProjectStore.getState().setCompileState("compiling");
    expect(useProjectStore.getState().compileStatus).toBe("compiling");
    useProjectStore
      .getState()
      .setCompileState("idle", blob);
    expect(useProjectStore.getState().compiledPdf).toBe(blob);
    useProjectStore.getState().setCompileState("error", null, "boom");
    expect(useProjectStore.getState().compileError).toBe("boom");
  });
});
