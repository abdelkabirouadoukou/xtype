import {
  LATEX_COMMANDS,
  COMMAND_CATEGORIES,
  type Category,
} from "../src/lib/editor/completions/latex-commands";

export {};

const byCategory = new Map<Category, typeof LATEX_COMMANDS>();
for (const c of LATEX_COMMANDS) {
  const list = byCategory.get(c.category) ?? [];
  list.push(c);
  byCategory.set(c.category, list);
}

let md = `---
title: Command Reference
---

# Command Reference

Type \`\\\` \` in the editor and keep typing letters to filter. **Tab** accepts a
suggestion and jumps between its placeholders. Highlight a row to preview the
rendered result.

This page is generated from the same database that powers the editor popup —
they cannot drift apart.

`;

for (const [category, name] of Object.entries(COMMAND_CATEGORIES)) {
  const commands = byCategory.get(category as Category) ?? [];
  md += `## ${name}\n\n| Trigger | Inserts | Renders | \n|---|---|---|\n`;
  for (const c of commands) {
    const glyphMatch = c.detail.match(/:\s*([^:]+)$/);
    const glyph = glyphMatch?.[1]?.trim() ?? "";
    md += `| \\\`${c.trigger}\\\` | \\\`${c.label}\\\` | ${glyph} |\n`;
  }
  md += "\n";
}

const json = LATEX_COMMANDS.map((c) => ({
  trigger: c.trigger,
  label: c.label,
  category: c.category,
  detail: c.detail,
}));
await Bun.write("src/generated/commands.json", JSON.stringify(json, null, 2));
await Bun.write("content-docs/writing/commands.md", md);
console.log(`generated content-docs/writing/commands.md (${LATEX_COMMANDS.length} commands)`);
