import { useEffect, useMemo, useState } from "react";
import { insertAtCursor } from "@/lib/editor/image-upload";

interface SymbolGroup {
  label: string;
  symbols: { insert: string; display: string }[];
}

const GROUPS: SymbolGroup[] = [
  {
    label: "Greek",
    symbols: "α β γ δ ε ζ η θ ι κ λ μ ν ξ π ρ σ τ υ φ χ ψ ω Γ Δ Θ Λ Ξ Π Σ Φ Ψ Ω"
      .split(" ")
      .map((s) => ({ insert: s, display: s })),
  },
  {
    label: "Operators",
    symbols: [
      { insert: "\\times", display: "×" },
      { insert: "\\div", display: "÷" },
      { insert: "\\pm", display: "±" },
      { insert: "\\leq", display: "≤" },
      { insert: "\\geq", display: "≥" },
      { insert: "\\neq", display: "≠" },
      { insert: "\\approx", display: "≈" },
      { insert: "\\equiv", display: "≡" },
      { insert: "\\infty", display: "∞" },
      { insert: "\\partial", display: "∂" },
      { insert: "\\nabla", display: "∇" },
      { insert: "\\sum", display: "∑" },
      { insert: "\\prod", display: "∏" },
      { insert: "\\int", display: "∫" },
      { insert: "\\lim", display: "lim" },
      { insert: "\\sqrt{}", display: "√" },
      { insert: "\\frac{}{}", display: "⁄" },
    ],
  },
  {
    label: "Arrows",
    symbols: [
      { insert: "\\to", display: "→" },
      { insert: "\\gets", display: "←" },
      { insert: "\\leftrightarrow", display: "↔" },
      { insert: "\\Rightarrow", display: "⇒" },
      { insert: "\\Leftarrow", display: "⇐" },
      { insert: "\\Leftrightarrow", display: "⇔" },
      { insert: "\\mapsto", display: "↦" },
    ],
  },
];

export default function SymbolPalette({
  getView,
}: {
  getView: () => unknown | null;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const groups = useMemo(() => GROUPS, []);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="border-b border-border px-3 py-1.5 text-left text-xs text-muted-foreground hover:text-foreground"
        title="Symbol palette (Cmd+J)"
      >
        ∑ symbols
      </button>
    );
  }

  return (
    <div className="flex w-52 shrink-0 flex-col overflow-y-auto border-l border-border">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Symbols
        </span>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
          ×
        </button>
      </div>
      {groups.map((g) => (
        <div key={g.label} className="border-b border-border px-2 py-2">
          <p className="mb-1.5 px-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            {g.label}
          </p>
          <div className="grid grid-cols-5 gap-1">
            {g.symbols.map((s) => (
              <button
                key={s.insert}
                title={s.insert}
                onClick={() => {
                  const view = getView();
                  if (view) insertAtCursor(view, s.insert);
                }}
                className="rounded px-1 py-0.5 text-sm hover:bg-background"
              >
                {s.display}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
