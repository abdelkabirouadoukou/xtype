import { and, eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { getDb } from "../../lib/db";
import { projects } from "../../lib/db/schema";
import { hasDb } from "../../lib/env";
import { getAuthUserId, unauthorized } from "../../lib/server/auth";
import { createRateLimiter, rateLimitMiddleware } from "@thexjs/core";

const limiter = createRateLimiter();

export async function POST(req: Request) {
  const limited = await rateLimitMiddleware(limiter, req);
  if (limited) return limited;
  const userId = await getAuthUserId(req);
  if (!userId) return unauthorized();
  if (!hasDb()) return Response.json({ error: "database-disabled" }, { status: 503 });
  const body = (await req.json().catch(() => null)) as
    | { projectId?: string; revoke?: boolean }
    | null;
  if (!body?.projectId) return Response.json({ error: "projectId-required" }, { status: 400 });
  const db = getDb();
  const [owned] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, body.projectId), eq(projects.ownerId, userId)))
    .limit(1);
  if (!owned) return Response.json({ error: "not-found" }, { status: 404 });

  const token = body.revoke ? null : randomBytes(12).toString("base64url");
  await db.update(projects).set({ shareToken: token }).where(eq(projects.id, body.projectId));
  return Response.json({ shareToken: token });
}
