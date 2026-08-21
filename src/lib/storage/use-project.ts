import { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, newFileId, newFolderId, type NodeRow } from "./db";
import { useProjectStore } from "@/lib/state/project-store";
import type { Chapter } from "@/types/project";

export function useProject(projectId: string) {
  const nodes = useLiveQuery(
    () => db.nodes.where("projectId").equals(projectId).toArray(),
    [projectId],
  );

  useEffect(() => {
    useProjectStore.getState().setProject(projectId);
    ensureProjectSeed(projectId);
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { pullRemote } = await import("@/lib/sync/cloud-sync");
      if (!cancelled) await pullRemote(projectId);
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    if (!nodes) return;
    const files = nodes.filter((n) => n.type === "file");
    const chapters: Chapter[] = files.map((n) => ({
      id: n.id,
      filename: n.name,
      content: n.content ?? "",
      dirty: false,
    }));
    useProjectStore.getState().loadChapters(chapters);
  }, [nodes]);

  return { loading: nodes === undefined, nodes };
}

async function ensureProjectSeed(projectId: string) {
  const { ensureProject } = await import("./db");
  await ensureProject(projectId);
}

export async function createFile(
  projectId: string,
  name: string,
  parentId: string | null,
  order: number,
) {
  const finalName = name.endsWith(".md") ? name : `${name}.md`;
  await db.nodes.put({
    id: newFileId(projectId),
    projectId,
    parentId,
    name: finalName,
    type: "file",
    content: "",
    order,
    updatedAt: Date.now(),
  });
}

export async function createFolder(
  projectId: string,
  name: string,
  parentId: string | null,
  order: number,
) {
  await db.nodes.put({
    id: newFolderId(projectId),
    projectId,
    parentId,
    name,
    type: "folder",
    order,
    updatedAt: Date.now(),
  });
}

export async function renameNode(id: string, newName: string) {
  const node = await db.nodes.get(id);
  if (!node || !newName.trim()) return;
  const name =
    node.type === "file" && !newName.endsWith(".md") ? `${newName}.md` : newName;
  await db.nodes.update(id, { name, updatedAt: Date.now() });
}

export function isDescendant(
  candidateAncestorId: string,
  nodeId: string,
  all: NodeRow[],
): boolean {
  if (nodeId === candidateAncestorId) return true;
  let current = all.find((n) => n.id === nodeId);
  while (current?.parentId) {
    if (current.parentId === candidateAncestorId) return true;
    current = all.find((n) => n.id === current!.parentId);
  }
  return false;
}

export async function moveNode(id: string, parentId: string | null, all: NodeRow[]) {
  const node = await db.nodes.get(id);
  if (!node) return;
  if (parentId === id) return;
  if (node.parentId === parentId) return;
  if (node.type === "folder" && parentId && isDescendant(id, parentId, all)) return;
  const siblings = all.filter((n) => n.parentId === parentId);
  await db.nodes.update(id, {
    parentId,
    order: siblings.length ? Math.max(...siblings.map((s) => s.order)) + 1 : 0,
    updatedAt: Date.now(),
  });
}

export async function deleteNode(id: string) {
  const node = await db.nodes.get(id);
  if (!node) return;
  if (node.type === "folder") {
    const all = await db.nodes.where("projectId").equals(node.projectId).toArray();
    const doomed = collectDescendants(id, all);
    await db.nodes.bulkDelete(doomed.map((d) => d.id));
  }
  await db.nodes.delete(id);
}

function collectDescendants(folderId: string, all: NodeRow[]): NodeRow[] {
  const out: NodeRow[] = [];
  const walk = (parentId: string) => {
    for (const n of all.filter((x) => x.parentId === parentId)) {
      out.push(n);
      if (n.type === "folder") walk(n.id);
    }
  };
  walk(folderId);
  return out;
}

export async function saveChapterContent(id: string, content: string) {
  await db.nodes.update(id, { content, updatedAt: Date.now() });
}
