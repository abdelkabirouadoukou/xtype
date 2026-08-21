import { StreamLanguage } from "@codemirror/language";
import type { StreamParser } from "@codemirror/language";

function scanUntilClose(
  stream: { next: () => string | void; peek: () => string | undefined },
  close: (a: string, b: string | null) => boolean,
): boolean {
  let prev = "";
  let ch = stream.next();
  while (ch !== undefined && ch !== null) {
    if (close(ch, stream.peek() ?? null) && prev !== "\\") return true;
    prev = ch;
    ch = stream.next();
  }
  return false;
}

const mathParser: StreamParser<null> = {
  name: "xtype-math",
  token(stream) {
    const sol = stream.sol();
    if (stream.match("$$")) return scanUntilClose(stream, (c, n) => c === "$" && n === "$") ? "keyword" : "string";
    if (stream.match("$")) return scanUntilClose(stream, (c) => c === "$") ? "keyword" : "string";
    if (stream.match("::")) return scanUntilClose(stream, (c) => c === ":") ? "number" : "string";
    if (sol && stream.match(/^#{1,6}\s.*$/)) return "heading";
    if (stream.match(/^\*\*[^*\n]+\*\*/)) return "strong";
    if (stream.match(/^\*[^*\n]+\*/)) return "emphasis";
    if (stream.match(/^`[^`\n]+`/)) return "monospace";
    if (stream.match(/^(?:-|\d+\.)\s/)) return "list";
    if (sol && stream.match(/^>\s/)) return "quote";
    stream.next();
    return null;
  },
};

export const xtypeLanguage = StreamLanguage.define(mathParser);
