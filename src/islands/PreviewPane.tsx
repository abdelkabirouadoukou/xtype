import { useEffect, useMemo, useState } from "react";
import { useProjectStore } from "@/lib/state/project-store";
import { renderFastPreview } from "@/lib/preview/fast-render";

export default function PreviewPane({ chapterId }: { chapterId: string }) {
  const content = useProjectStore((s) => s.chapters[chapterId]?.content ?? "");
  const compiledPdf = useProjectStore((s) => s.compiledPdf);
  const [mode, setMode] = useState<"fast" | "pdf">("fast");
  const html = useMemo(() => renderFastPreview(content), [content]);
  const pdfUrl = usePdfObjectUrl(compiledPdf);

  useEffect(() => {
    if (compiledPdf) setMode("pdf");
  }, [compiledPdf]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5 text-xs">
        <div className="flex gap-1">
          <ModeButton active={mode === "fast"} onClick={() => setMode("fast")}>
            Fast
          </ModeButton>
          <ModeButton
            active={mode === "pdf"}
            onClick={() => pdfUrl && setMode("pdf")}
            disabled={!pdfUrl}
          >
            PDF
          </ModeButton>
        </div>
        {pdfUrl && (
          <a
            href={pdfUrl}
            download="xtype.pdf"
            className="text-muted-foreground hover:text-foreground"
          >
            ↓ download
          </a>
        )}
      </div>
      <div className="flex-1 overflow-y-auto bg-white">
        {mode === "pdf" && pdfUrl ? (
          <embed src={pdfUrl} className="h-full w-full" type="application/pdf" />
        ) : (
          <div className="prose-katex mx-auto max-w-2xl px-6 py-6 text-black">
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        )}
      </div>
    </div>
  );
}

function ModeButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded px-2 py-0.5 ${
        active ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"
      } ${disabled ? "opacity-40" : ""}`}
    >
      {children}
    </button>
  );
}

function usePdfObjectUrl(pdf: Blob | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!pdf) return;
    const objectUrl = URL.createObjectURL(pdf);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [pdf]);
  return url;
}
