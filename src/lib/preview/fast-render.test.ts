import { describe, expect, it } from "bun:test";
import { renderFastPreview } from "./fast-render";

describe("fast preview", () => {
  it("renders inline math", () => {
    const html = renderFastPreview("Euler: $e^{i\\pi} = -1$.");
    expect(html).toContain("katex");
    expect(html).toContain("Euler:");
  });

  it("renders display math", () => {
    const html = renderFastPreview("$$\\int_0^1 x^2 dx$$");
    expect(html).toContain("katex-display");
  });

  it("renders asciimath", () => {
    const html = renderFastPreview("::a/b::");
    expect(html).toContain("katex");
  });

  it("keeps math out of markdown parsing", () => {
    const html = renderFastPreview("# Title\n\n$a*b*c$ and *italic*");
    expect(html).toContain("<h1");
    expect(html).toContain("italic</em>");
    expect(html).not.toContain("$a");
  });

  it("survives malformed tex", () => {
    const html = renderFastPreview("$$\\frac{broken$$");
    expect(html).toContain("katex");
  });
});
