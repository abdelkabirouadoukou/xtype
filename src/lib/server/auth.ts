import { verifyToken } from "@clerk/backend";
import { env, hasClerk } from "../env";

export async function getAuthUserId(req: Request): Promise<string | null> {
  if (!hasClerk()) return null;
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const cookie = req.headers
    .get("cookie")
    ?.match(/(?:^|;\s*)__session=([^\s;]+)/)?.[1];
  const token = bearer || (cookie ? decodeURIComponent(cookie) : null);
  if (!token) return null;
  try {
    const { sub } = await verifyToken(token, { secretKey: env.CLERK_SECRET_KEY! });
    return sub ?? null;
  } catch {
    return null;
  }
}

export function unauthorized() {
  return Response.json({ error: "unauthorized" }, { status: 401 });
}
