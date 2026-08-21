import { useMemo } from "react";
import { useProjectStore } from "@/lib/state/project-store";
import { renderFastPreview } from "@/lib/preview/fast-render";

export default function PreviewPane({ chapterId }: { chapterId: string }) {
  const content = useProjectStore(
    (s) => s.chapters[chapterId]?.content ?? "",
  );
  const html = useMemo(() => renderFastPreview(content), [content]);

  return (
    <div className="h-full overflow-y-auto">
      <div
        className="prose-katex mx-auto max-w-2xl px-6 py-6"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
