import { describe, expect, it } from "bun:test";
import { filterCommands, LATEX_COMMANDS } from "./latex-commands";

describe("latex commands", () => {
  it("has a healthy database", () => {
    expect(LATEX_COMMANDS.length).toBeGreaterThan(100);
    for (const c of LATEX_COMMANDS) {
      expect(c.trigger.startsWith("\\")).toBe(true);
      expect(c.template.length).toBeGreaterThan(0);
      expect(c.detail.length).toBeGreaterThan(0);
    }
  });

  it("triggers are unique", () => {
    const triggers = LATEX_COMMANDS.map((c) => c.trigger);
    expect(new Set(triggers).size).toBe(triggers.length);
  });

  it("filters by prefix", () => {
    const fr = filterCommands("\\fr");
    expect(fr.some((c) => c.trigger === "\\frac")).toBe(true);
    expect(fr.every((c) => c.trigger.startsWith("\\fr"))).toBe(true);
  });

  it("greek letters are generated", () => {
    expect(filterCommands("\\alpha").length).toBeGreaterThan(0);
    expect(filterCommands("\\Omega").length).toBeGreaterThan(0);
  });

  it("snippet templates keep tab stops", () => {
    const frac = filterCommands("\\frac").find((c) => c.trigger === "\\frac");
    expect(frac?.template).toBe("\\frac{1}{2}");
  });
});
