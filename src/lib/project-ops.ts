import { db } from "@/lib/storage/db";
import { useProjectStore } from "@/lib/state/project-store";

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

export async function trashProject(projectId: string) {
  await db.projects.update(projectId, { deletedAt: Date.now() });
}

export async function restoreProject(projectId: string) {
  await db.projects.update(projectId, { deletedAt: undefined });
}

export async function deleteForever(projectId: string) {
  await db.transaction("rw", db.projects, db.nodes, async () => {
    await db.nodes.where("projectId").equals(projectId).delete();
    await db.projects.delete(projectId);
  });
}

export async function purgeExpiredTrash() {
  const cutoff = Date.now() - THIRTY_DAYS;
  const expired = await db.projects
    .filter((p) => typeof p.deletedAt === "number" && (p as { deletedAt: number }).deletedAt < cutoff)
    .toArray();
  for (const p of expired) await deleteForever(p.id);
}

export async function duplicateProject(projectId: string): Promise<string | null> {
  const src = await db.projects.get(projectId);
  if (!src) return null;
  const newId = crypto.randomUUID().slice(0, 8);
  await db.projects.add({
    ...src,
    id: newId,
    name: `${src.name} (copy)`,
    createdAt: Date.now(),
    deletedAt: undefined,
  });
  const nodes = await db.nodes.where("projectId").equals(projectId).toArray();
  const idMap = new Map<string, string>();
  for (const n of nodes) idMap.set(n.id, crypto.randomUUID().slice(0, 12));
  await db.nodes.bulkAdd(
    nodes.map((n) => ({
      ...n,
      id: idMap.get(n.id)!,
      projectId: newId,
      parentId: n.parentId ? (idMap.get(n.parentId) ?? null) : null,
    })),
  );
  return newId;
}

export async function renameProject(projectId: string, name: string) {
  await db.projects.update(projectId, { name });
}

export interface ImportedFile {
  path: string;
  content: string;
}

export async function importFiles(
  projectId: string,
  files: ImportedFile[],
): Promise<number> {
  let order = 0;
  for (const f of files) {
    if (!/\.(md|bib|typ)$/i.test(f.path)) continue;
    if (f.path.split("/").length > 3) continue;
    await db.nodes.add({
      id: crypto.randomUUID().slice(0, 12),
      projectId,
      parentId: null,
      name: f.path.split("/").pop() ?? f.path,
      type: "file",
      content: f.content.slice(0, 200_000),
      order: order++,
      updatedAt: Date.now(),
    });
  }
  return order;
}

export async function importZip(projectId: string, file: File): Promise<number> {
  const { unzipSync } = await import("fflate");
  const buf = new Uint8Array(await file.arrayBuffer());
  const entries = unzipSync(buf);
  const files: ImportedFile[] = [];
  for (const [path, data] of Object.entries(entries)) {
    if (path.endsWith("/")) continue;
    files.push({ path, content: new TextDecoder().decode(data) });
  }
  return importFiles(projectId, files);
}

interface GhTreeEntry {
  path: string;
  type: string;
  url?: string;
}

export async function importGitHub(
  projectId: string,
  repoUrl: string,
): Promise<number> {
  const m = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/i);
  if (!m) throw new Error("Invalid GitHub URL");
  const [, owner, repo] = m;
  const branchRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
  if (!branchRes.ok) throw new Error("Repo not found or private");
  const meta = (await branchRes.json()) as { default_branch: string };
  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${meta.default_branch}?recursive=1`,
  );
  if (!treeRes.ok) throw new Error("Could not read repo tree");
  const tree = (await treeRes.json()) as { tree: GhTreeEntry[] };
  const mdFiles = tree.tree.filter(
    (e) => e.type === "blob" && /\.(md|bib|typ)$/i.test(e.path),
  );
  const files: ImportedFile[] = [];
  for (const entry of mdFiles.slice(0, 50)) {
    const raw = await fetch(
      `https://raw.githubusercontent.com/${owner}/${repo}/${meta.default_branch}/${entry.path}`,
    );
    if (raw.ok) files.push({ path: entry.path, content: await raw.text() });
  }
  return importFiles(projectId, files);
}

export async function searchAllChapters(
  query: string,
): Promise<{ chapterId: string; filename: string; snippet: string }[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const chapters = useProjectStore.getState().chapters;
  const out: { chapterId: string; filename: string; snippet: string }[] = [];
  for (const c of Object.values(chapters)) {
    const idx = c.content.toLowerCase().indexOf(q);
    if (idx === -1) continue;
    out.push({
      chapterId: c.id,
      filename: c.filename,
      snippet: c.content.slice(Math.max(0, idx - 30), idx + q.length + 40).replace(/\n/g, " "),
    });
  }
  return out;
}
