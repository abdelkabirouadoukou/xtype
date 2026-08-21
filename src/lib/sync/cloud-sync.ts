import { db } from "@/lib/storage/db";
import { useProjectStore } from "@/lib/state/project-store";

interface ClerkSession {
  getToken: () => Promise<string | null>;
}

interface ClerkWindow {
  Clerk?: {
    loaded?: boolean;
    user?: { id: string } | null;
    session?: ClerkSession | null;
  };
}

function clerk(): ClerkWindow["Clerk"] | undefined {
  return (window as unknown as ClerkWindow).Clerk;
}

export function isSignedIn(): boolean {
  return Boolean(clerk()?.loaded && clerk()?.user);
}

let syncing = false;
let pendingAgain = false;

async function authedFetch(url: string, init: RequestInit): Promise<Response> {
  const token = await clerk()?.session?.getToken();
  return fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
}

export async function pullRemote(projectId: string): Promise<boolean> {
  if (!isSignedIn()) return false;
  const res = await authedFetch(`/api/projects/${projectId}`, { method: "GET" });
  if (!res.ok) return false;
  const data = (await res.json()) as {
    project?: { title?: string; updatedAt?: string };
    nodes?: Array<{
      id: string;
      projectId: string;
      parentId: string | null;
      name: string;
      type: string;
      order: number;
      content: string;
      updatedAt: string;
    }>;
  };
  if (!data.nodes) return false;
  const localNodes = await db.nodes.where("projectId").equals(projectId).toArray();
  const localById = new Map(localNodes.map((n) => [n.id, n]));
  for (const rn of data.nodes) {
    const ln = localById.get(rn.id);
    const remoteAt = new Date(rn.updatedAt).getTime();
    const localAt = typeof ln?.updatedAt === "number" ? ln.updatedAt : -1;
    if (remoteAt > localAt) {
      await db.nodes.put({
        id: rn.id,
        projectId,
        parentId: rn.parentId,
        name: rn.name,
        type: rn.type as "file" | "folder",
        order: rn.order,
        content: rn.content,
        updatedAt: remoteAt,
      });
    }
  }
  return true;
}

export async function pushSnapshot(projectId: string): Promise<void> {
  if (syncing) {
    pendingAgain = true;
    return;
  }
  if (!isSignedIn()) return;
  syncing = true;
  try {
    const [nodes, project] = await Promise.all([
      db.nodes.where("projectId").equals(projectId).toArray(),
      db.projects.get(projectId),
    ]);
    const store = useProjectStore.getState();
    const payload = {
      title: project?.name ?? "Untitled",
      nodes: nodes.map((n) => ({
        id: n.id,
        parentId: n.parentId,
        name: n.name,
        type: n.type,
        order: n.order,
        content:
          n.type === "file" ? (store.chapters[n.id]?.content ?? n.content ?? "") : "",
        updatedAt: new Date(n.updatedAt).toISOString(),
      })),
    };
    const res = await authedFetch(`/api/projects/${projectId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = (await res.json()) as {
        nodes?: Array<{ id: string; updatedAt: string }>;
      };
      for (const rn of data.nodes ?? []) {
        const ln = await db.nodes.get(rn.id);
        if (ln) await db.nodes.put({ ...ln, updatedAt: Date.parse(rn.updatedAt) });
      }
    }
  } finally {
    syncing = false;
    if (pendingAgain) {
      pendingAgain = false;
      setTimeout(() => void pushSnapshot(projectId), 1000);
    }
  }
}

export async function queueCloudSyncForNode(nodeId: string): Promise<void> {
  const node = await db.nodes.get(nodeId);
  if (!node) return;
  void pushSnapshot(node.projectId);
}
