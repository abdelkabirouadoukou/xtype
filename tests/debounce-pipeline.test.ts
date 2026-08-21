import { describe, test, expect, beforeEach, mock } from "bun:test";

function makeClock() {
  let now = 0;
  let seq = 0;
  const timers = new Map<number, { at: number; fn: () => void }>();
  return {
    get now() {
      return now;
    },
    schedule(fn: () => void, ms: number) {
      const id = ++seq;
      timers.set(id, { at: now + ms, fn });
      return () => timers.delete(id);
    },
    async advance(to: number) {
      now = to;
      for (const [id, t] of [...timers]) {
        if (t.at <= to) {
          timers.delete(id);
          t.fn();
        }
      }
      await new Promise((r) => setTimeout(r, 0));
    },
  };
}

describe("debounce pipeline", () => {
  beforeEach(() => {
    mock.module("@/lib/sync/cloud-sync", () => ({
      queueCloudSyncForNode: async () => {},
      pushSnapshot: async () => {},
      pullRemote: async () => false,
      isSignedIn: () => false,
    }));
  });

  test("compile debounce coalesces keystrokes into one compile per window", async () => {
    const clock = makeClock();
    const compiles: number[] = [];
    const { useProjectStore } = await import("@/lib/state/project-store");
    useProjectStore.getState().loadChapters([
      { id: "c1", filename: "a.md", content: "", dirty: false },
    ]);
    const { createPipeline } = await import("@/lib/editor/debounce-pipeline");
    const pipe = createPipeline(
      { compile: () => compiles.push(clock.now), save: async () => {} },
      { schedule: clock.schedule },
    );

    pipe.onEditorChange("c1", "a");
    await clock.advance(100);
    pipe.onEditorChange("c1", "ab");
    await clock.advance(200);
    expect(compiles.length).toBe(0);
    pipe.onEditorChange("c1", "abc");
    await clock.advance(460);
    expect(compiles.length).toBe(1);

    pipe.onEditorChange("c1", "abcd");
    await clock.advance(800);
    expect(compiles.length).toBe(2);
  });

  test("save debounce fires after save window and clears dirty", async () => {
    const clock = makeClock();
    const savedContents: Record<string, string> = {};
    const { useProjectStore } = await import("@/lib/state/project-store");
    useProjectStore.getState().loadChapters([
      { id: "s1", filename: "s.md", content: "", dirty: false },
    ]);
    const { createPipeline } = await import("@/lib/editor/debounce-pipeline");
    const pipe = createPipeline(
      {
        compile: () => {},
        save: async (id, content) => {
          savedContents[id] = content;
        },
      },
      { schedule: clock.schedule },
    );

    pipe.onEditorChange("s1", "draft text");
    await clock.advance(1999);
    expect(savedContents["s1"]).toBeUndefined();
    await clock.advance(2000);
    expect(savedContents["s1"]).toBe("draft text");
    expect(useProjectStore.getState().chapters["s1"]?.dirty).toBe(false);
  });

  test("flushSave persists immediately and cancels the pending timer", async () => {
    const clock = makeClock();
    const saved: number[] = [];
    const { useProjectStore } = await import("@/lib/state/project-store");
    useProjectStore.getState().loadChapters([
      { id: "f1", filename: "f.md", content: "", dirty: false },
    ]);
    const { createPipeline } = await import("@/lib/editor/debounce-pipeline");
    const pipe = createPipeline(
      { compile: () => {}, save: async () => saved.push(clock.now) },
      { schedule: clock.schedule },
    );

    pipe.onEditorChange("f1", "content");
    const t0 = clock.now;
    await pipe.flushSave("f1");
    expect(saved).toEqual([t0]);
    await clock.advance(10_000);
    expect(saved).toEqual([t0]);
  });

  test("flushAllSaves drains every pending chapter", async () => {
    const clock = makeClock();
    const saved: string[] = [];
    const { useProjectStore } = await import("@/lib/state/project-store");
    useProjectStore.getState().loadChapters([
      { id: "x1", filename: "x.md", content: "", dirty: false },
      { id: "x2", filename: "y.md", content: "", dirty: false },
    ]);
    const { createPipeline } = await import("@/lib/editor/debounce-pipeline");
    const pipe = createPipeline(
      { compile: () => {}, save: async (id) => saved.push(id) },
      { schedule: clock.schedule },
    );
    pipe.onEditorChange("x1", "1");
    pipe.onEditorChange("x2", "2");
    await pipe.flushAllSaves();
    expect(saved.sort()).toEqual(["x1", "x2"]);
  });

  test("cloud sync hook fires after successful save", async () => {
    const clock = makeClock();
    const synced: string[] = [];
    mock.module("@/lib/storage/use-project", () => ({
      saveChapterContent: async () => {},
    }));
    const { useProjectStore } = await import("@/lib/state/project-store");
    useProjectStore.getState().loadChapters([
      { id: "cs1", filename: "c.md", content: "", dirty: false },
    ]);
    const { createPipeline } = await import("@/lib/editor/debounce-pipeline");
    const pipe = createPipeline(
      {
        compile: () => {},
        save: async () => {},
        cloudSync: (id) => synced.push(id),
      },
      { schedule: clock.schedule },
    );
    pipe.onEditorChange("cs1", "hello");
    await pipe.flushSave("cs1");
    expect(synced).toEqual(["cs1"]);
  });
});
