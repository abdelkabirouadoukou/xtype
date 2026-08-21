import Dexie, { type Table } from "dexie";
import type { ChapterRow, ProjectRow } from "@/types/project";

class XTypeDB extends Dexie {
  projects!: Table<ProjectRow, string>;
  chapters!: Table<ChapterRow, string>;

  constructor() {
    super("xtype-db");
    this.version(1).stores({
      projects: "id, name, createdAt",
      chapters: "id, projectId, filename, updatedAt",
    });
  }
}

export const db = new XTypeDB();

export function chapterId(projectId: string, filename: string) {
  return `${projectId}:${filename}`;
}

export async function ensureProject(projectId: string) {
  await db.projects.put({
    id: projectId,
    name: projectId,
    createdAt: Date.now(),
  });
  const existing = await db.chapters
    .where("projectId")
    .equals(projectId)
    .toArray();
  if (existing.length === 0) {
    await db.chapters.put({
      id: chapterId(projectId, "chapter1.md"),
      projectId,
      filename: "chapter1.md",
      content:
        "# Chapter 1\n\nStart writing. Inline math like $e^{i\\pi} = -1$.\n",
      updatedAt: Date.now(),
    });
  }
}
