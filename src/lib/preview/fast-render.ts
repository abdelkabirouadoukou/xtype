import katex from "katex";
import { marked } from "marked";
import asciiMathToLatex from "asciimath-to-latex";

const BLOCK_MATH = /\$\$([\s\S]+?)\$\$/g;
const INLINE_MATH = /\$([^$\n]+?)\$/g;
const ASCII_MATH = /::([^:\n]+?)::/g;

function tex(tex: string, displayMode: boolean): string {
  return katex.renderToString(tex.trim(), {
    displayMode,
    throwOnError: false,
    errorColor: "#f87171",
  });
}

export function renderFastPreview(source: string): string {
  const slots: string[] = [];
  const stash = (html: string) => {
    slots.push(html);
    return `\u0000MATH${slots.length - 1}\u0000`;
  };

  const stashed = source
    .replace(BLOCK_MATH, (_, m) => stash(tex(m, true)))
    .replace(ASCII_MATH, (_, m) => stash(tex(asciiMathToLatex(m), false)))
    .replace(INLINE_MATH, (_, m) => stash(tex(m, false)));

  const body = marked.parse(stashed, { async: false });

  return body.replace(/\u0000MATH(\d+)\u0000/g, (_, i) => slots[Number(i)]);
}
