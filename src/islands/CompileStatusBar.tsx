import { useEffect, useState } from "react";
import { useProjectStore } from "@/lib/state/project-store";

export default function CompileStatusBar() {
  const compileStatus = useProjectStore((s) => s.compileStatus);
  const compileError = useProjectStore((s) => s.compileError);
  const compiledPdf = useProjectStore((s) => s.compiledPdf);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);

  useEffect(() => {
    if (compileStatus === "idle" && compiledPdf) setFinishedAt(Date.now());
  }, [compileStatus, compiledPdf]);

  return (
    <span className="flex items-center gap-3 text-xs">
      {compileStatus === "compiling" && (
        <span className="text-yellow-500">compiling…</span>
      )}
      {compileStatus === "error" && (
        <span className="text-red-400" title={compileError ?? ""}>
          compile error
        </span>
      )}
      {compileStatus === "idle" && finishedAt && (
        <span className="text-muted-foreground">
          pdf ready {new Date(finishedAt).toLocaleTimeString()}
        </span>
      )}
    </span>
  );
}
