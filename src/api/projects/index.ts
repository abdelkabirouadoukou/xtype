import { eq } from "drizzle-orm";
import { getDb } from "../../lib/db";
import { projects } from "../../lib/db/schema";
import { hasDb } from "../../lib/env";
import { getAuthUserId, unauthorized } from "../../lib/server/auth";
import { getPlan, withinProjectLimit } from "../../lib/server/entitlements";
import { createRateLimiter, rateLimitMiddleware } from "@thexjs/core";

const limiter = createRateLimiter();

export async function GET(req: Request) {
  const limited = await rateLimitMiddleware(limiter, req);
  if (limited) return limited;
  const userId = await getAuthUserId(req);
  if (!userId) return unauthorized();
  if (!hasDb()) return Response.json({ error: "database-disabled" }, { status: 503 });
  const rows = await getDb()
    .select()
    .from(projects)
    .where(eq(projects.ownerId, userId));
  return Response.json({ projects: rows });
}

export async function POST(req: Request) {
  const limited = await rateLimitMiddleware(limiter, req);
  if (limited) return limited;
  const userId = await getAuthUserId(req);
  if (!userId) return unauthorized();
  if (!hasDb()) return Response.json({ error: "database-disabled" }, { status: 503 });
  const body = (await req.json().catch(() => null)) as
    | { id?: string; title?: string }
    | null;
  if (!body?.id) return Response.json({ error: "id-required" }, { status: 400 });
  const db = getDb();
  const existing = await db
    .select()
    .from(projects)
    .where(eq(projects.id, body.id))
    .limit(1);
  if (existing[0]) {
    if (existing[0].ownerId !== userId) {
      return Response.json({ error: "forbidden" }, { status: 403 });
    }
    return Response.json({ project: existing[0] });
  }
  const existingCount = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.ownerId, userId));
  const plan = await getPlan(userId);
  if (!withinProjectLimit(plan, existingCount.length)) {
    return Response.json({ error: "project-limit-reached", plan }, { status: 402 });
  }
  const [row] = await db
    .insert(projects)
    .values({
      id: body.id,
      ownerId: userId,
      title: body.title ?? "Untitled",
      updatedAt: new Date(),
    })
    .returning();
  return Response.json({ project: row }, { status: 201 });
}
