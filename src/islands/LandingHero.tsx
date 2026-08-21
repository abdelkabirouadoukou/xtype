import { useEffect, useRef, useState } from "react";
import { renderFastPreview } from "@/lib/preview/fast-render";

const SCRIPT =
  "The quadratic formula: $$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$ and Euler says $e^{i\\pi} = -1$.";
const CHAR_MS = 26;

export default function LandingHero() {
  const [typed, setTyped] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let i = 0;
    timerRef.current = setInterval(() => {
      i += 1;
      setTyped(SCRIPT.slice(0, i));
      if (i >= SCRIPT.length && timerRef.current) clearInterval(timerRef.current);
    }, CHAR_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const rendered = renderFastPreview(typed);

  return (
    <div className="grid grid-cols-1 gap-6 rounded-2xl border border-[rgba(43,38,32,0.1)] bg-white p-6 shadow-sm sm:grid-cols-2">
      <pre className="min-h-40 whitespace-pre-wrap font-[family-name:var(--font-mono)] text-sm text-[#5a5248]">
        {typed}
        <span className="animate-pulse">▌</span>
      </pre>
      <div
        className="min-h-40 self-center text-lg [&_p]:my-2"
        dangerouslySetInnerHTML={{ __html: rendered }}
      />
    </div>
  );
}
