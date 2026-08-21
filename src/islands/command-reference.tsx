import { useEffect, useMemo, useRef, useState } from "react";
import katex from "katex";
import commandsJson from "@/generated/commands.json";

interface CommandRow {
  trigger: string;
  label: string;
  category: string;
  detail: string;
}

const CATEGORIES = [...new Set((commandsJson as CommandRow[]).map((c) => c.category))];

export default function CommandReference() {
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commandsJson as CommandRow[];
    return (commandsJson as CommandRow[]).filter(
      (c) =>
        c.trigger.toLowerCase().includes(q) ||
        c.label.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q),
    );
  }, [query]);

  const byCategory = useMemo(() => {
    const m = new Map<string, CommandRow[]>();
    for (const c of filtered) {
      const list = m.get(c.category) ?? [];
      list.push(c);
      m.set(c.category, list);
    }
    return m;
  }, [filtered]);

  return (
    <div className="mt-8">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Filter 105 commands…"
        className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-accent"
      />
      {[...byCategory.entries()].map(([cat, rows]) => (
        <section key={cat} className="mt-8">
          <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {cat}
          </h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <tbody>
                {rows.map((c) => {
                  const glyph = c.detail.match(/:\s*([^:]+)$/)?.[1]?.trim() ?? "";
                  let html = "";
                  try {
                    html = glyph ? katex.renderToString(glyph, { throwOnError: false }) : "";
                  } catch { html = ""; }
                  return (
                    <tr key={c.trigger + c.label} className="border-b border-border last:border-0">
                      <td className="w-32 px-4 py-2.5">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(c.trigger);
                            setCopied(c.trigger);
                            if (timer.current) clearTimeout(timer.current);
                            timer.current = setTimeout(() => setCopied(null), 1200);
                          }}
                          className="rounded bg-background px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-xs hover:bg-border"
                          title="Click to copy"
                        >
                          {copied === c.trigger ? "copied!" : c.trigger}
                        </button>
                      </td>
                      <td className="px-4 py-2.5 font-[family-name:var(--font-mono)] text-xs text-muted-foreground">
                        {c.label}
                      </td>
                      <td className="px-4 py-2.5">{html && <span dangerouslySetInnerHTML={{ __html: html }} />}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
