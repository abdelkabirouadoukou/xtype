import { createHash } from "node:crypto";
import { env } from "../../lib/env";
import { getAuthUserId, unauthorized } from "../../lib/server/auth";
import { createRateLimiter, rateLimitMiddleware } from "@thexjs/core";

const limiter = createRateLimiter();

export async function POST(req: Request) {
  const limited = await rateLimitMiddleware(limiter, req);
  if (limited) return limited;
  const userId = await getAuthUserId(req);
  if (!userId) return unauthorized();
  if (!env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET || !env.CLOUDINARY_CLOUD_NAME) {
    return Response.json({ error: "uploads-disabled" }, { status: 503 });
  }
  const body = (await req.json().catch(() => null)) as { folder?: string } | null;
  const folder = body?.folder ?? `xtype/${userId}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`)
    .digest("hex");
  return Response.json({
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    folder,
    timestamp,
    signature,
  });
}
