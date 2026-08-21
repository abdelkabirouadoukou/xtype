import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = "content-docs";

interface SearchDoc {
  id: string;
  title: string;
  section: string;
  text: string;
}

function parseFrontmatter(raw: string): { fm: Record<string, string>; body: string } {
  if (!raw.startsWith("---")) return { fm: {}, body: raw };
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return { fm: {}, body: raw };
  const fm: Record<string, string> = {};
  for (const line of raw.slice(4, end).split("\n")) {
    const m = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (m) fm[m[1]] = m[2].trim();
  }
  return { fm, body: raw.slice(end + 4) };
}

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    try {
      if (readdirSync(full)) walk(full, out);
    } catch {
      if (name.endsWith(".md")) out.push(full);
    }
  }
  return out;
}

const docs: SearchDoc[] = [];
for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file).replace(/\.md$/, "");
  const segments = rel.split(/[/\\]/).filter((s) => s !== "index" && s !== "docs");
  const { fm, body } = parseFrontmatter(readFileSync(file, "utf-8"));
  docs.push({
    id: segments.join("/"),
    title: fm.title ?? segments.join("/"),
    section: segments.length > 1 ? segments[0] : "",
    text: body.replace(/[#*`$:\\|>-]/g, " ").replace(/\s+/g, " ").slice(0, 4000),
  });
}

await Bun.write("public/search-index.json", JSON.stringify(docs));
console.log(`generated public/search-index.json (${docs.length} docs)`);
