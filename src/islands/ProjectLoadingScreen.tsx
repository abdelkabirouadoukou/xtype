import { useMemo } from "react";
import katex from "katex";

const PIECES = ["x", "=", "\\frac{-b", "\\pm", "\\sqrt{b^2-4ac}}{2a}"];

export default function ProjectLoadingScreen() {
  const rendered = useMemo(
    () => PIECES.map((p) => katex.renderToString(p, { throwOnError: false })),
    [],
  );

  return (
    <div className="flex h-full flex-col items-center justify-center gap-10 px-8">
      <div
        className="flex items-baseline gap-1 text-2xl"
        aria-label="Preparing your project"
      >
        {rendered.map((html, i) => (
          <span
            key={i}
            className="inline-block animate-[assemble_.5s_ease-out_both]"
            style={{ animationDelay: `${i * 0.18}s` }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ))}
      </div>

      <div className="grid w-full max-w-3xl grid-cols-2 gap-4">
        <SkeletonPane label="editor" />
        <SkeletonPane label="preview" delay="0.15s" />
      </div>
    </div>
  );
}

function SkeletonPane({ label, delay = "0s" }: { label: string; delay?: string }) {
  return (
    <div
      className="h-64 animate-pulse rounded-xl border border-border bg-card p-4"
      style={{ animationDelay: delay }}
    >
      <div className="mb-3 h-2 w-16 rounded bg-border" />
      {[92, 78, 85, 60].map((w, i) => (
        <div
          key={i}
          className="mb-2 h-2 rounded bg-border"
          style={{ width: `${w}%` }}
        />
      ))}
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
