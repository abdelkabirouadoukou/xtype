import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { marked } from "marked";
import { substituteMath, restoreMath } from "../src/lib/preview/math-sub";

export {};

const ROOT = "content-docs";

interface DocEntry {
  slug: string;
  title: string;
  section: string;
  html: string;
  headings: { id: string; text: string; level: number }[];
}

function parseFrontmatter(raw: string): { fm: Record<string, string>; body: string } {
  if (!raw.startsWith("---")) return { fm: {}, body: raw };
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return { fm: {}, body: raw };
  const head = raw.slice(4, end);
  const body = raw.slice(end + 4).replace(/^\s*\n/, "");
  const fm: Record<string, string> = {};
  for (const line of head.split("\n")) {
    const m = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (m) fm[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return { fm, body };
}

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (name.startsWith(".")) continue;
    try {
      if (readdirSync(full)) walk(full, out);
    } catch {
      if (name.endsWith(".md")) out.push(full);
    }
  }
  return out;
}

const files = walk(ROOT).sort();
const entries: DocEntry[] = [];

for (const file of files) {
  const rel = relative(ROOT, file).replace(/\.md$/, "");
  const segments = rel.split(/[/\\]/).filter((s) => s !== "index" && s !== "docs");
  const slug = segments.join("/");
  const raw = readFileSync(file, "utf-8");
  const { fm, body } = parseFrontmatter(raw);
  const { text, slots } = substituteMath(body);
  const rawHtml = marked.parse(text, { async: false });
  const headings: DocEntry["headings"] = [];
  let h = 0;
  const html = restoreMath(
    rawHtml.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_, lvl, inner) => {
      const id = `h-${h++}`;
      headings.push({ id, text: inner.replace(/<[^>]*>/g, ""), level: Number(lvl) });
      return `<h${lvl} id="${id}">${inner}</h${lvl}>`;
    }),
    slots,
  );
  entries.push({
    slug,
    title: fm.title ?? slug,
    section: segments.length > 1 ? segments[0] : "",
    html,
    headings,
  });
}

const ts = `export interface DocEntry {
  slug: string;
  title: string;
  section: string;
  html: string;
  headings: { id: string; text: string; level: number }[];
}

export const DOCS: DocEntry[] = ${JSON.stringify(entries, null, 2)};
`;

await Bun.write("src/generated/docs-data.ts", ts);
console.log(`generated src/generated/docs-data.ts (${entries.length} pages)`);
