import Dexie, { type Table } from "dexie";
import type { ProjectRow } from "@/types/project";

export interface NodeRow {
  id: string;
  projectId: string;
  parentId: string | null;
  name: string;
  type: "file" | "folder";
  content?: string;
  order: number;
  updatedAt: number;
}

export interface SnapshotRow {
  id: string;
  chapterId: string;
  content: string;
  createdAt: number;
}

export interface AssetRow {
  id: string;
  projectId: string;
  name: string;
  url: string;
  createdAt: number;
}

class XTypeDB extends Dexie {
  projects!: Table<ProjectRow, string>;
  nodes!: Table<NodeRow, string>;
  assets!: Table<AssetRow, string>;
  snapshots!: Table<SnapshotRow, string>;

  constructor() {
    super("xtype-db");
    this.version(1).stores({
      projects: "id, name, createdAt",
      chapters: "id, projectId, filename, updatedAt",
    });
    this.version(2)
      .stores({
        projects: "id, name, createdAt",
        nodes: "id, projectId, parentId, type, order",
      })
      .upgrade(async (tx) => {
        const old = await tx.table("chapters").toArray();
        await tx.table("nodes").bulkAdd(
          old.map((c: { id: string; projectId: string; filename: string; content: string; updatedAt: number }, i) => ({
            id: c.id,
            projectId: c.projectId,
            parentId: null,
            name: c.filename,
            type: "file" as const,
            content: c.content,
            order: i,
            updatedAt: c.updatedAt,
          })),
        );
        await tx.table("chapters").toCollection().delete();
      });
    this.version(3).stores({
      projects: "id, name, createdAt",
      nodes: "id, projectId, parentId, type, order",
      assets: "id, projectId",
    });
    this.version(5).stores({
      projects: "id, name, createdAt, deletedAt",
      nodes: "id, projectId, parentId, type, order",
      assets: "id, projectId",
      snapshots: "id, chapterId, createdAt",
    });
    this.version(4).stores({
      projects: "id, name, createdAt, deletedAt",
      nodes: "id, projectId, parentId, type, order",
      assets: "id, projectId",
    });
  }
}

export const db = new XTypeDB();

export function newFileId(projectId: string) {
  return `${projectId}:f${Math.random().toString(36).slice(2, 10)}`;
}

export function newFolderId(projectId: string) {
  return `${projectId}:d${Math.random().toString(36).slice(2, 10)}`;
}

export async function ensureProject(projectId: string) {
  await db.projects.put({
    id: projectId,
    name: projectId,
    createdAt: Date.now(),
  });
  const existing = await db.nodes
    .where("projectId")
    .equals(projectId)
    .toArray();
  if (existing.length === 0) {
    await db.nodes.put({
      id: newFileId(projectId),
      projectId,
      parentId: null,
      name: "chapter1.md",
      type: "file",
      content:
        "# Chapter 1\n\nStart writing. Inline math like $e^{i\\pi} = -1$.\nTry typing \\fr for autocomplete.\n",
      order: 0,
      updatedAt: Date.now(),
    });
  }
}
