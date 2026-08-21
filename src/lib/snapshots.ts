import { db, type SnapshotRow } from "@/lib/storage/db";

export async function takeSnapshot(chapterId: string): Promise<void> {
  const { useProjectStore } = await import("@/lib/state/project-store");
  const chapter = useProjectStore.getState().chapters[chapterId];
  if (!chapter) return;
  const prev = chapter.content;
  if (!prev.trim()) return;
  const existing = await db.snapshots.where("chapterId").equals(chapterId).toArray();
  if (existing[0] && existing.sort((a, b) => b.createdAt - a.createdAt)[0]?.content === prev) return;
  await db.snapshots.add({
    id: crypto.randomUUID(),
    chapterId,
    content: prev,
    createdAt: Date.now(),
  });
  const sorted = [...existing].sort((a, b) => b.createdAt - a.createdAt);
  for (const old of sorted.slice(9)) await db.snapshots.delete(old.id);
}

export async function listSnapshots(chapterId: string): Promise<SnapshotRow[]> {
  return (
    await db.snapshots.where("chapterId").equals(chapterId).toArray()
  ).sort((a, b) => b.createdAt - a.createdAt);
}

export function diffStat(a: string, b: string): { added: number; removed: number } {
  const aLines = a.split("\n");
  const bLines = b.split("\n");
  const aSet = new Map<string, number>();
  for (const l of aLines) aSet.set(l, (aSet.get(l) ?? 0) + 1);
  let added = 0;
  for (const l of bLines) {
    const n = aSet.get(l) ?? 0;
    if (n > 0) aSet.set(l, n - 1);
    else added += 1;
  }
  let removed = 0;
  for (const n of aSet.values()) removed += n;
  return { added, removed };
}

export async function restoreSnapshot(
  chapterId: string,
  snapshotId: string,
): Promise<boolean> {
  const snap = await db.snapshots.get(snapshotId);
  if (!snap) return false;
  await takeSnapshot(chapterId);
  const { useProjectStore } = await import("@/lib/state/project-store");
  useProjectStore.getState().setActiveContent(chapterId, snap.content);
  const { saveChapterContent } = await import("@/lib/storage/use-project");
  await saveChapterContent(chapterId, snap.content);
  return true;
}

export async function checkQuota(): Promise<{ pct: number; warning: boolean } | null> {
  try {
    const est = await navigator.storage?.estimate?.();
    if (!est?.quota || !est.usage) return null;
    const pct = Math.round((est.usage / est.quota) * 100);
    return { pct, warning: pct > 80 };
  } catch {
    return null;
  }
}
