import { useMemo } from "react";
import { useProjectStore } from "@/lib/state/project-store";

interface Heading {
  line: number;
  level: number;
  text: string;
}

export default function OutlinePanel({ chapterId }: { chapterId: string }) {
  const content = useProjectStore(
    (s) => s.chapters[chapterId]?.content ?? "",
  );

  const headings = useMemo<Heading[]>(() => {
    const out: Heading[] = [];
    let inMath = false;
    content.split("\n").forEach((line, i) => {
      if (/^\s*\$\$/.test(line)) inMath = !inMath;
      if (inMath) return;
      const m = line.match(/^(#{1,3})\s+(.*)$/);
      if (m) out.push({ line: i, level: m[1].length, text: m[2].trim() });
    });
    return out;
  }, [content]);

  if (headings.length === 0) return null;

  const jump = (line: number) => {
    window.dispatchEvent(new CustomEvent("xtype:goto-line", { detail: line }));
  };

  return (
    <div className="hidden w-48 shrink-0 overflow-y-auto border-l border-border px-3 py-3 lg:block">
      <p className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        Outline
      </p>
      <ul className="flex flex-col gap-1 text-sm">
        {headings.map((h) => (
          <li key={`${h.line}-${h.text}`} style={{ paddingLeft: (h.level - 1) * 12 }}>
            <button
              onClick={() => jump(h.line)}
              className="block w-full truncate text-left text-muted-foreground transition-colors hover:text-foreground"
              title={h.text}
            >
              {h.text || "—"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
