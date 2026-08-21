import { eq } from "drizzle-orm";
import { getDb } from "../../lib/db";
import { nodes, projects } from "../../lib/db/schema";
import { hasDb } from "../../lib/env";
import { createRateLimiter, rateLimitMiddleware } from "@thexjs/core";

const limiter = createRateLimiter();

export async function GET(req: Request) {
  const limited = await rateLimitMiddleware(limiter, req);
  if (limited) return limited;
  if (!hasDb()) return Response.json({ error: "database-disabled" }, { status: 503 });
  const token = new URL(req.url).pathname.split("/").pop() ?? "";
  if (!token) return Response.json({ error: "not-found" }, { status: 404 });
  const db = getDb();
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.shareToken, token))
    .limit(1);
  if (!project) return Response.json({ error: "not-found" }, { status: 404 });
  const rows: { type: string; name: string; content: string }[] = await db
    .select()
    .from(nodes)
    .where(eq(nodes.projectId, project.id));
  return Response.json({
    title: project.title,
    files: rows.filter((r) => r.type === "file").map((r) => ({ name: r.name, content: r.content })),
  });
}
