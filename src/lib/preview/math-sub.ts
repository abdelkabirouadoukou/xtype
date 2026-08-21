import katex from "katex";
import { marked } from "marked";
import asciiMathToLatex from "asciimath-to-latex";

export const BLOCK_MATH = /\$\$([\s\S]+?)\$\$/g;
export const INLINE_MATH = /\$([^$\n]+?)\$/g;
export const ASCII_MATH = /::([^:\n]+?)::/g;

export function renderTex(tex: string, displayMode: boolean): string {
  return katex.renderToString(tex.trim(), {
    displayMode,
    throwOnError: false,
    errorColor: "#f87171",
  });
}

export function substituteMath(source: string): {
  text: string;
  slots: string[];
} {
  const slots: string[] = [];
  const stash = (html: string) => {
    slots.push(html);
    return `\u0000MATH${slots.length - 1}\u0000`;
  };
  const text = source
    .replace(BLOCK_MATH, (_, m) => stash(renderTex(m, true)))
    .replace(ASCII_MATH, (_, m) => stash(renderTex(asciiMathToLatex(m), false)))
    .replace(INLINE_MATH, (_, m) => stash(renderTex(m, false)));
  return { text, slots };
}

export function restoreMath(html: string, slots: string[]): string {
  return html.replace(/\u0000MATH(\d+)\u0000/g, (_, i) => slots[Number(i)]);
}
