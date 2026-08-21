import { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useProjectStore } from "@/lib/state/project-store";
import {
  createFile,
  createFolder,
  deleteNode,
  moveNode,
} from "@/lib/storage/use-project";
import type { NodeRow } from "@/lib/storage/db";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";

export default function FileTree({
  projectId,
  nodes,
}: {
  projectId: string;
  nodes: NodeRow[];
}) {
  const activeId = useProjectStore((s) => s.activeChapterId);
  const setActive = useProjectStore((s) => s.setActiveChapter);
  const [renaming, setRenaming] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const childrenByParent = useMemo(() => {
    const map = new Map<string | null, NodeRow[]>();
    for (const n of nodes) {
      const list = map.get(n.parentId) ?? [];
      list.push(n);
      map.set(n.parentId, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
    return map;
  }, [nodes]);

  const roots = childrenByParent.get(null) ?? [];

  function handleDragEnd(e: DragEndEvent) {
    const id = String(e.active.id);
    const overId = e.over?.id ? String(e.over.id) : null;
    if (!overId) return;
    const target =
      overId === "tree-root"
        ? null
        : (nodes.find((n) => n.id === overId)?.type === "folder" ? overId : null);
    if (target === null && overId !== "tree-root") return;
    void moveNode(id, target, nodes);
  }

  async function addFile(parentId: string | null) {
    const siblings = (childrenByParent.get(parentId) ?? []).length;
    await createFile(projectId, `chapter${siblings + 1}.md`, parentId, siblings);
  }

  async function addFolder(parentId: string | null) {
    const siblings = (childrenByParent.get(parentId) ?? []).length;
    await createFolder(projectId, "new-folder", parentId, siblings);
  }

  return (
    <aside className="flex h-full w-56 flex-col border-r border-border bg-card">
      <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Chapters
        <span className="flex gap-1">
          <button onClick={() => addFolder(null)} className="rounded px-1.5 py-0.5 text-sm leading-none hover:bg-background" title="New folder">
            ▸+
          </button>
          <button onClick={() => addFile(null)} className="rounded px-1.5 py-0.5 text-sm leading-none hover:bg-background" title="New chapter">
            +
          </button>
        </span>
      </div>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <DropZone id="tree-root" className="flex-1 overflow-y-auto px-1 pb-4">
          {roots.map((n) => (
            <TreeNode
              key={n.id}
              node={n}
              childrenByParent={childrenByParent}
              allNodes={nodes}
              depth={0}
              activeId={activeId}
              onActivate={setActive}
              renaming={renaming}
              setRenaming={setRenaming}
              onAddFile={addFile}
              onAddFolder={addFolder}
            />
          ))}
        </DropZone>
      </DndContext>
    </aside>
  );
}

function DropZone({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`${className} ${isOver ? "outline outline-1 outline-accent/60 rounded" : ""}`}>
      {children}
    </div>
  );
}

interface TreeNodeProps {
  node: NodeRow;
  childrenByParent: Map<string | null, NodeRow[]>;
  allNodes: NodeRow[];
  depth: number;
  activeId: string | null;
  onActivate: (id: string) => void;
  renaming: string | null;
  setRenaming: (id: string | null) => void;
  onAddFile: (parentId: string | null) => void;
  onAddFolder: (parentId: string | null) => void;
}

function TreeNode(props: TreeNodeProps) {
  const { node, childrenByParent, depth } = props;
  const [open, setOpen] = useState(true);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: node.id,
  });

  if (node.type === "file") {
    return (
      <DragHandle attributes={attributes} listeners={listeners} setNodeRef={setNodeRef} isDragging={isDragging}>
        <FileRow {...props} />
      </DragHandle>
    );
  }
  const kids = childrenByParent.get(node.id) ?? [];
  return (
    <DragHandle attributes={attributes} listeners={listeners} setNodeRef={setNodeRef} isDragging={isDragging}>
      <div>
        <FolderRow {...props} open={open} onToggle={() => setOpen(!open)}>
          <span className="hidden group-hover:flex gap-1 ml-auto">
            <IconBtn title="New chapter inside" onClick={() => props.onAddFile(node.id)}>+</IconBtn>
            <IconBtn title="Delete folder" onClick={() => confirmDelete(node)}>×</IconBtn>
          </span>
        </FolderRow>
        {open && (
          <DropZone id={node.id} className="">
            <div style={{ paddingLeft: `${(depth + 1) * 14}px` }}>
              {kids.map((k) => (
                <TreeNode key={k.id} {...props} node={k} depth={depth + 1} />
              ))}
              {kids.length === 0 && (
                <div className="py-1 text-xs text-muted-foreground italic">empty — drop here</div>
              )}
            </div>
          </DropZone>
        )}
      </div>
    </DragHandle>
  );
}

function FileRow({ node, depth, activeId, onActivate, renaming, setRenaming }: TreeNodeProps & object) {
  void depth;
  if (renaming === node.id) {
    return (
      <form
        className="px-2 py-1"
        onSubmit={async (e) => {
          e.preventDefault();
          const input = e.currentTarget.elements.namedItem("name") as HTMLInputElement;
          const { renameNode } = await import("@/lib/storage/use-project");
          await renameNode(node.id, input.value);
          setRenaming(null);
        }}
      >
        <input
          name="name"
          autoFocus
          defaultValue={node.name}
          onBlur={() => setRenaming(null)}
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm outline-none"
        />
      </form>
    );
  }
  return (
    <div
      className={`group flex cursor-pointer items-center px-2 py-1.5 text-sm ${
        activeId === node.id
          ? "bg-background text-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
      onClick={() => onActivate(node.id)}
    >
      <span className="truncate">
        {node.name}
        {useProjectStore.getState().chapters[node.id]?.dirty && (
          <span className="ml-1 text-accent">•</span>
        )}
      </span>
      <span className="hidden group-hover:flex gap-1 ml-auto">
        <IconBtn title="Rename" onClick={() => setRenaming(node.id)}>✎</IconBtn>
        <IconBtn title="Delete" onClick={() => confirmDelete(node)}>×</IconBtn>
      </span>
    </div>
  );
}

function FolderRow({ node, open, onToggle, children }: TreeNodeProps & { open: boolean; onToggle: () => void; children?: React.ReactNode }) {
  return (
    <div
      className="group flex cursor-pointer items-center px-2 py-1.5 text-sm font-medium hover:text-foreground"
      onClick={onToggle}
    >
      <span className={`mr-1 inline-block transition-transform ${open ? "rotate-90" : ""}`}>▸</span>
      <span className="truncate">{node.name}</span>
      {children}
    </div>
  );
}

async function confirmDelete(node: NodeRow) {
  const label = node.type === "folder" ? `folder "${node.name}" and everything inside` : node.name;
  if (confirm(`Delete ${label}?`)) {
    const { deleteNode } = await import("@/lib/storage/use-project");
    await deleteNode(node.id);
  }
}

function DragHandle({
  attributes,
  listeners,
  setNodeRef,
  isDragging,
  children,
}: {
  attributes: React.HTMLAttributes<HTMLElement>;
  listeners: SyntheticListenerMap | undefined;
  setNodeRef: (el: HTMLElement | null) => void;
  isDragging: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={isDragging ? "opacity-40" : ""}
    >
      {children}
    </div>
  );
}

function IconBtn({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="rounded px-1 leading-none hover:bg-background"
    >
      {children}
    </button>
  );
}
