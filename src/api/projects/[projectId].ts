import { and, eq } from "drizzle-orm";
import { getDb } from "../../lib/db";
import { nodes, projects } from "../../lib/db/schema";
import { hasDb } from "../../lib/env";
import { getAuthUserId, unauthorized } from "../../lib/server/auth";
import { createRateLimiter, rateLimitMiddleware } from "@thexjs/core";

const limiter = createRateLimiter();

function projectIdFrom(req: Request): string | null {
  const m = new URL(req.url).pathname.match(/^\/api\/projects\/([^/]+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}

async function ownedProject(req: Request) {
  const userId = await getAuthUserId(req);
  if (!userId) return { error: unauthorized() };
  const projectId = projectIdFrom(req);
  if (!projectId) return { error: Response.json({ error: "bad-path" }, { status: 400 }) };
  const [row] = await getDb()
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, userId)))
    .limit(1);
  if (!row) return { error: Response.json({ error: "not-found" }, { status: 404 }) };
  return { projectId, row };
}

export async function GET(req: Request) {
  const limited = await rateLimitMiddleware(limiter, req);
  if (limited) return limited;
  if (!hasDb()) return Response.json({ error: "database-disabled" }, { status: 503 });
  const owned = await ownedProject(req);
  if (owned.error) return owned.error;
  const rows = await getDb()
    .select()
    .from(nodes)
    .where(eq(nodes.projectId, owned.projectId!));
  return Response.json({ project: owned.row, nodes: rows });
}

interface SyncNode {
  id: string;
  parentId: string | null;
  name: string;
  type: string;
  order: number;
  content: string;
  updatedAt: string | number;
}

export async function PUT(req: Request) {
  const limited = await rateLimitMiddleware(limiter, req);
  if (limited) return limited;
  if (!hasDb()) return Response.json({ error: "database-disabled" }, { status: 503 });
  const owned = await ownedProject(req);
  if (owned.error) return owned.error;
  const body = (await req.json().catch(() => null)) as
    | { title?: string; nodes?: SyncNode[] }
    | null;
  if (!body) return Response.json({ error: "bad-body" }, { status: 400 });
  const db = getDb();
  const now = new Date();
  await db
    .update(projects)
    .set({ ...(body.title !== undefined ? { title: body.title } : {}), updatedAt: now })
    .where(eq(projects.id, owned.projectId!));
  if (Array.isArray(body.nodes)) {
    for (const n of body.nodes) {
      const updatedAt = new Date(n.updatedAt);
      if (Number.isNaN(updatedAt.getTime())) {
        return Response.json({ error: "bad-node-updatedAt", nodeId: n.id }, { status: 400 });
      }
      await db
        .insert(nodes)
        .values({
          id: n.id,
          projectId: owned.projectId!,
          parentId: n.parentId,
          name: n.name,
          type: n.type,
          order: n.order,
          content: n.content,
          updatedAt,
        })
        .onConflictDoUpdate({
          target: nodes.id,
          set: {
            parentId: n.parentId,
            name: n.name,
            type: n.type,
            order: n.order,
            content: n.content,
            updatedAt,
          },
          where: eq(nodes.projectId, owned.projectId!),
        });
    }
  }
  const fresh = await db.select().from(nodes).where(eq(nodes.projectId, owned.projectId!));
  return Response.json({ ok: true, nodes: fresh, syncedAt: now.toISOString() });
}

export async function DELETE(req: Request) {
  const limited = await rateLimitMiddleware(limiter, req);
  if (limited) return limited;
  if (!hasDb()) return Response.json({ error: "database-disabled" }, { status: 503 });
  const owned = await ownedProject(req);
  if (owned.error) return owned.error;
  await getDb().delete(projects).where(eq(projects.id, owned.projectId!));
  return Response.json({ ok: true });
}
