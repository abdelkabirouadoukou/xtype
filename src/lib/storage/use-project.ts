import { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, chapterId, ensureProject } from "./db";
import { useProjectStore } from "@/lib/state/project-store";
import type { Chapter } from "@/types/project";

export function useProject(projectId: string) {
  const rows = useLiveQuery(
    () =>
      db.chapters
        .where("projectId")
        .equals(projectId)
        .sortBy("filename"),
    [projectId],
  );

  useEffect(() => {
    useProjectStore.getState().setProject(projectId);
    ensureProject(projectId);
  }, [projectId]);

  useEffect(() => {
    if (!rows) return;
    const chapters: Chapter[] = rows.map((r) => ({
      id: r.id,
      filename: r.filename,
      content: r.content,
      dirty: false,
    }));
    useProjectStore.getState().loadChapters(chapters);
  }, [rows]);

  return { loading: rows === undefined };
}

export async function createChapter(projectId: string, filename: string) {
  const name = filename.endsWith(".md") ? filename : `${filename}.md`;
  await db.chapters.put({
    id: chapterId(projectId, name),
    projectId,
    filename: name,
    content: "",
    updatedAt: Date.now(),
  });
}

export async function renameChapter(
  projectId: string,
  oldName: string,
  newName: string,
) {
  const name = newName.endsWith(".md") ? newName : `${newName}.md`;
  const oldId = chapterId(projectId, oldName);
  const row = await db.chapters.get(oldId);
  if (!row || !name || name === oldName) return;
  await db.chapters.delete(oldId);
  await db.chapters.put({ ...row, id: chapterId(projectId, name), filename: name });
}

export async function deleteChapter(id: string) {
  await db.chapters.delete(id);
}

export async function saveChapterContent(id: string, content: string) {
  await db.chapters.update(id, { content, updatedAt: Date.now() });
}
