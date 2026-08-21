import { useState } from "react";
import { useProjectStore } from "@/lib/state/project-store";
import {
  createChapter,
  deleteChapter,
  renameChapter,
} from "@/lib/storage/use-project";

export default function FileTree({ projectId }: { projectId: string }) {
  const chapters = useProjectStore((s) => s.chapters);
  const activeId = useProjectStore((s) => s.activeChapterId);
  const setActive = useProjectStore((s) => s.setActiveChapter);
  const [renaming, setRenaming] = useState<string | null>(null);

  const list = Object.values(chapters).sort((a, b) =>
    a.filename.localeCompare(b.filename),
  );

  return (
    <aside className="flex h-full w-56 flex-col border-r border-border bg-card">
      <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Chapters
        <button
          onClick={() => createChapter(projectId, `chapter${list.length + 1}.md`)}
          className="rounded px-1.5 py-0.5 text-sm leading-none hover:bg-background"
          title="New chapter"
        >
          +
        </button>
      </div>
      <ul className="flex-1 overflow-y-auto">
        {list.map((c) => (
          <li key={c.id}>
            {renaming === c.id ? (
              <form
                className="px-2 py-1"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const input = e.currentTarget.elements.namedItem(
                    "name",
                  ) as HTMLInputElement;
                  await renameChapter(projectId, c.filename, input.value);
                  setRenaming(null);
                }}
              >
                <input
                  name="name"
                  autoFocus
                  defaultValue={c.filename}
                  onBlur={() => setRenaming(null)}
                  className="w-full rounded border border-border bg-background px-2 py-1 text-sm outline-none"
                />
              </form>
            ) : (
              <div
                className={`group flex cursor-pointer items-center justify-between px-3 py-1.5 text-sm ${
                  activeId === c.id
                    ? "bg-background text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActive(c.id)}
              >
                <span className="truncate">
                  {c.filename}
                  {c.dirty && <span className="ml-1 text-accent">•</span>}
                </span>
                <span className="hidden gap-1 group-hover:flex">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenaming(c.id);
                    }}
                    title="Rename"
                  >
                    ✎
                  </button>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (confirm(`Delete ${c.filename}?`)) {
                        await deleteChapter(c.id);
                      }
                    }}
                    title="Delete"
                  >
                    ×
                  </button>
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}
