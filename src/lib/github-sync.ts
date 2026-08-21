import { db } from "@/lib/storage/db";

const PAT_KEY = "xtype:gh-pat";

export function getPat(): string {
  try {
    return localStorage.getItem(PAT_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setPat(pat: string) {
  try {
    localStorage.setItem(PAT_KEY, pat);
  } catch {}
}

function headers() {
  return {
    authorization: `Bearer ${getPat()}`,
    accept: "application/vnd.github+json",
  };
}

interface GhContent {
  path: string;
  sha: string;
  type: string;
}

export async function pushToRepo(
  owner: string,
  repo: string,
  projectId: string,
): Promise<{ pushed: number; conflicts: string[] }> {
  const nodes = await db.nodes.where("projectId").equals(projectId).toArray();
  const files = nodes.filter((n) => n.type === "file");
  let pushed = 0;
  const conflicts: string[] = [];

  const existing = new Map<string, string>();
  const listRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
    { headers: headers() },
  );
  if (listRes.ok) {
    const tree = (await listRes.json()) as { tree: GhContent[] };
    for (const e of tree.tree) existing.set(e.path, e.sha);
  }

  for (const f of files) {
    const path = f.name;
    const body: Record<string, unknown> = {
      message: `xtype sync: ${f.name}`,
      content: btoa(unescape(encodeURIComponent(f.content ?? ""))),
    };
    const remoteSha = existing.get(path);
    if (remoteSha) body.sha = remoteSha;
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: "PUT",
      headers: { ...headers(), "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) pushed += 1;
    else if (res.status === 409 || res.status === 422) conflicts.push(f.name);
  }
  return { pushed, conflicts };
}

export async function pullFromRepo(
  owner: string,
  repo: string,
  projectId: string,
): Promise<number> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
    { headers: headers() },
  );
  if (!res.ok) throw new Error("Cannot read repo (check PAT + repo name)");
  const tree = (await res.json()) as { tree: GhContent[] };
  const targets = tree.tree.filter(
    (e) => e.type === "blob" && /\.(md|bib|typ)$/i.test(e.path),
  );
  let count = 0;
  for (const entry of targets.slice(0, 50)) {
    const raw = await fetch(
      `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${entry.path}`,
    );
    if (!raw.ok) continue;
    const content = await raw.text();
    const name = entry.path.split("/").pop()!;
    const existingNode = await db.nodes
      .where("projectId")
      .equals(projectId)
      .filter((n) => n.name === name)
      .first();
    if (existingNode) {
      if (existingNode.content !== content) {
        await db.nodes.update(existingNode.id, { content, updatedAt: Date.now() });
        count += 1;
      }
    } else {
      await db.nodes.add({
        id: crypto.randomUUID().slice(0, 12),
        projectId,
        parentId: null,
        name,
        type: "file",
        content,
        order: count++,
        updatedAt: Date.now(),
      });
      count += 1;
    }
  }
  return count;
}
