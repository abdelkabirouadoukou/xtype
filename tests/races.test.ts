import { describe, test, expect } from "bun:test";

describe("typst generation counter race", () => {
  test("stale results are dropped by gen check", async () => {
    let latestGen = 0;
    const posted: { gen: number; kind: string }[] = [];

    function simulateCompile(gen: number, delayMs: number) {
      latestGen = Math.max(latestGen, gen);
      setTimeout(() => {
        if (gen !== latestGen) return;
        posted.push({ gen, kind: "result" });
      }, delayMs);
    }

    simulateCompile(1, 100);
    simulateCompile(2, 30);
    await new Promise((r) => setTimeout(r, 150));

    expect(posted).toEqual([{ gen: 2, kind: "result" }]);
  });

  test("scanUndefinedRefs flags only unresolved targets", async () => {
    const { scanUndefinedRefs } = await import("@/lib/compiler/typst-client");
    const source = "see @eq-energy and @missing-one";
    const files = { "other.md": "has <eq-energy> label here" };
    expect(scanUndefinedRefs(source, files)).toEqual(["missing-one"]);
  });
});

describe("sync LWW reconciliation", () => {
  test("remote newer wins; local newer untouched", async () => {
    const remote = [
      { id: "a", projectId: "p", parentId: null, name: "a.md", type: "file", order: 0, content: "remote-new", updatedAt: new Date(2000).toISOString() },
      { id: "b", projectId: "p", parentId: null, name: "b.md", type: "file", order: 1, content: "remote-old", updatedAt: new Date(500).toISOString() },
    ];
    const local = [
      { id: "a", projectId: "p", parentId: null, name: "a.md", type: "file" as const, order: 0, content: "local-old", updatedAt: 1000 },
      { id: "b", projectId: "p", parentId: null, name: "b.md", type: "file" as const, order: 1, content: "local-new", updatedAt: 3000 },
    ];

    const decisions = remote.map((rn) => {
      const ln = local.find((l) => l.id === rn.id);
      const remoteAt = Date.parse(rn.updatedAt);
      const localAt = typeof ln?.updatedAt === "number" ? ln.updatedAt : -1;
      return { id: rn.id, apply: remoteAt > localAt };
    });

    expect(decisions).toEqual([
      { id: "a", apply: true },
      { id: "b", apply: false },
    ]);
  });
});
